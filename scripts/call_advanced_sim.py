"""Utility script to exercise /advanced_sim for multiple apps."""
from __future__ import annotations

import json

import httpx

APPS = ["voting", "medical", "supply"]


def main() -> None:
    results: dict[str, dict[str, float | bool]] = {}
    with httpx.Client(timeout=120.0) as client:
        for app in APPS:
            response = client.post(
                "http://127.0.0.1:8000/advanced_sim",
                json={"app_type": app, "rounds": 2, "batch_size": 20},
            )
            response.raise_for_status()
            data = response.json()
            results[app] = {
                "chain_valid": data["chain_valid"],
                "entropy": data["entropy"],
                "proof_time": data["metrics"]["proof_time"],
            }
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
