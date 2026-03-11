from __future__ import annotations

from fastapi.testclient import TestClient

from src.backend import models


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
