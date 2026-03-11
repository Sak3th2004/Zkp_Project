from __future__ import annotations

from fastapi.testclient import TestClient


def test_tampered_proof_fails(client: TestClient):
    payload = {
        "secret": "attack-secret",
        "statement": "attack-statement",
        "app_type": "identity",
        "rounds": 2,
        "batch_size": 1,
    }
    prove_response = client.post("/zkp_prove", json=payload)
    bundle = prove_response.json()["bundles"][0]
    bundle["proofs"][0]["response"] += 1
    verify_response = client.post("/zkp_verify", json={"bundle": bundle})
    assert verify_response.status_code == 400
