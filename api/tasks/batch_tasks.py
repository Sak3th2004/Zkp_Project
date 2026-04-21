"""Batch proof processing task — handles large batch create/verify operations."""

from __future__ import annotations

import time
import uuid

from api.tasks.celery_app import celery_app
from zkp_engine import SchnorrProver, SchnorrVerifier
from zkp_engine.models import Proof
from zkp_engine.utils import bytes_to_point, generate_proof_id


@celery_app.task(bind=True, name="batch_proof_process", max_retries=3)
def batch_proof_process(self, batch_id: str, operation: str, items: list[dict], webhook_url: str | None = None):
    """Process a batch of proof create or verify operations.

    Args:
        batch_id: Unique batch identifier.
        operation: 'create' or 'verify'.
        items: List of proof items to process.
        webhook_url: Optional URL to POST results to when complete.
    """
    results = []
    successful = 0
    failed = 0

    for i, item in enumerate(items):
        start = time.perf_counter()
        try:
            if operation == "create":
                private_key = int(item["private_key"], 16)
                message = item.get("message")
                message_bytes = message.encode() if message else None

                prover = SchnorrProver(private_key=private_key)
                proof = prover.create_proof_with_message(message=message_bytes)

                latency_ms = (time.perf_counter() - start) * 1000
                results.append({
                    "index": i,
                    "proof": {
                        "commitment": {"x": format(proof.commitment_x, "x"), "y": format(proof.commitment_y, "x")},
                        "challenge": format(proof.challenge, "x"),
                        "response": format(proof.response, "x"),
                        "message_hash": proof.message_hash,
                    },
                    "proof_id": generate_proof_id(),
                    "latency_ms": round(latency_ms, 2),
                })
                successful += 1

            elif operation == "verify":
                pub_bytes = bytes.fromhex(item["public_key"])
                public_key = bytes_to_point(pub_bytes)

                proof_data = item["proof"]
                proof = Proof(
                    commitment_x=int(proof_data["commitment"]["x"], 16),
                    commitment_y=int(proof_data["commitment"]["y"], 16),
                    challenge=int(proof_data["challenge"], 16),
                    response=int(proof_data["response"], 16),
                    message_hash=proof_data.get("message_hash"),
                )

                verifier = SchnorrVerifier(public_key=public_key)
                message = item.get("message")
                if message:
                    valid = verifier.verify_with_message(proof, message.encode())
                else:
                    valid = verifier.verify(proof)

                latency_ms = (time.perf_counter() - start) * 1000
                results.append({
                    "index": i,
                    "valid": valid,
                    "latency_ms": round(latency_ms, 2),
                })
                successful += 1

        except Exception as e:
            latency_ms = (time.perf_counter() - start) * 1000
            results.append({
                "index": i,
                "error": str(e),
                "latency_ms": round(latency_ms, 2),
            })
            failed += 1

    # If webhook_url provided, POST results
    if webhook_url:
        try:
            import httpx
            httpx.post(webhook_url, json={
                "batch_id": batch_id,
                "status": "completed",
                "total_items": len(items),
                "successful": successful,
                "failed": failed,
                "results": results,
            }, timeout=10)
        except Exception:
            pass  # Log but don't fail the batch

    return {
        "batch_id": batch_id,
        "status": "completed",
        "total_items": len(items),
        "successful": successful,
        "failed": failed,
        "results": results,
    }
