from __future__ import annotations

from fastapi.testclient import TestClient

from src.backend import models

API_KEY = "sk_test_integration_key_1234567890"


def test_zkp_prove_endpoint(client: TestClient):
    payload = {
        "secret": "integration-secret",
        "statement": "integration-statement",
        "app_type": "voting",
        "rounds": 2,
        "batch_size": 5,
    }
    response = client.post("/zkp_prove", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "bundles" in body
    assert len(body["bundles"]) == payload["batch_size"]


def test_advanced_sim_endpoint(client: TestClient):
    payload = {"app_type": "medical", "rounds": 2, "batch_size": 10}
    response = client.post("/advanced_sim", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["chain_valid"] is True
    assert "metrics" in data


def test_v1_health_endpoint(client: TestClient):
    response = client.get("/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"


def test_v1_key_proof_and_verify_flow(client: TestClient):
    headers = {"X-API-Key": API_KEY}
    key_resp = client.post("/v1/keys/generate", json={}, headers=headers)
    assert key_resp.status_code == 201
    key_body = key_resp.json()

    proof_resp = client.post(
        "/v1/proofs/create",
        json={
            "private_key": key_body["private_key"],
            "public_key": key_body["public_key"]["compressed"],
            "message": "hello-zkproof",
            "rounds": 1,
        },
        headers=headers,
    )
    assert proof_resp.status_code == 201
    proof_body = proof_resp.json()

    verify_resp = client.post(
        "/v1/proofs/verify",
        json={
            "proof": proof_body["proof"],
            "public_key": key_body["public_key"]["compressed"],
            "message": "hello-zkproof",
        },
        headers=headers,
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["valid"] is True


def test_v1_auth_challenge_and_respond(client: TestClient):
    headers = {"X-API-Key": API_KEY}
    key_resp = client.post("/v1/keys/generate", json={}, headers=headers)
    key_body = key_resp.json()

    challenge_resp = client.post(
        "/v1/auth/challenge",
        json={
            "public_key": key_body["public_key"]["compressed"],
            "session_id": "sess_test_001",
            "ttl_seconds": 60,
        },
        headers=headers,
    )
    assert challenge_resp.status_code == 201
    challenge = challenge_resp.json()

    proof_resp = client.post(
        "/v1/proofs/create",
        json={
            "private_key": key_body["private_key"],
            "public_key": key_body["public_key"]["compressed"],
            "message": challenge["challenge_nonce"],
            "rounds": 1,
        },
        headers=headers,
    )
    assert proof_resp.status_code == 201

    respond_resp = client.post(
        "/v1/auth/respond",
        json={
            "challenge_id": challenge["challenge_id"],
            "proof": proof_resp.json()["proof"],
        },
        headers=headers,
    )
    assert respond_resp.status_code == 200
    assert respond_resp.json()["authenticated"] is True


def test_v1_requires_api_key(client: TestClient):
    response = client.post("/v1/keys/generate", json={})
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["type"] == "invalid_api_key"
