"""Integration tests for the FastAPI /v1 API endpoints.

These tests use httpx.AsyncClient against the real FastAPI app.
Note: Endpoints requiring API key auth are tested with mocked dependencies.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from api.main import app


@pytest.fixture
async def client():
    """Async HTTP test client for the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoint:
    """Health check is public — no auth required."""

    @pytest.mark.asyncio
    async def test_health_returns_200(self, client: AsyncClient) -> None:
        resp = await client.get("/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "uptime_seconds" in data

    @pytest.mark.asyncio
    async def test_health_has_request_id(self, client: AsyncClient) -> None:
        resp = await client.get("/v1/health")
        assert "x-request-id" in resp.headers


class TestOpenAPIEndpoints:
    """Verify Swagger and ReDoc are accessible."""

    @pytest.mark.asyncio
    async def test_openapi_json(self, client: AsyncClient) -> None:
        resp = await client.get("/openapi.json")
        assert resp.status_code == 200
        data = resp.json()
        assert data["info"]["title"] == "ZKProofAPI"

    @pytest.mark.asyncio
    async def test_docs_page(self, client: AsyncClient) -> None:
        resp = await client.get("/docs")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_redoc_page(self, client: AsyncClient) -> None:
        resp = await client.get("/redoc")
        assert resp.status_code == 200


class TestUnauthenticatedAccess:
    """Protected endpoints must reject requests without API key."""

    @pytest.mark.asyncio
    async def test_keys_generate_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/v1/keys/generate", json={})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_proofs_create_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/v1/proofs/create", json={
            "private_key": "abc",
            "public_key": "02abc",
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_proofs_verify_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/v1/proofs/verify", json={
            "proof": {
                "commitment": {"x": "1", "y": "2"},
                "challenge": "3",
                "response": "4",
            },
            "public_key": "02abc",
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_usage_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.get("/v1/usage")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_auth_challenge_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/v1/auth/challenge", json={
            "public_key": "02abc",
            "session_id": "sess_1",
        })
        assert resp.status_code == 401
