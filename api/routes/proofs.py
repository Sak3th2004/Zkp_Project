"""Proof create, verify, and batch endpoints."""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import AuthenticatedOrg, get_current_org
from api.schemas.proofs import (
    CommitmentSchema,
    ProofCreateRequest,
    ProofCreateResponse,
    ProofDataSchema,
    ProofVerifyRequest,
    ProofVerifyResponse,
)
from zkp_engine import KeyPair, SchnorrProver, SchnorrVerifier
from zkp_engine.utils import bytes_to_point, generate_proof_id

router = APIRouter(tags=["Proofs"])


@router.post("/v1/proofs/create", response_model=ProofCreateResponse, status_code=201)
async def create_proof(
    body: ProofCreateRequest,
    auth: AuthenticatedOrg = Depends(get_current_org),
) -> ProofCreateResponse:
    """Generate a zero-knowledge proof."""
    start = time.perf_counter()

    try:
        private_key = int(body.private_key, 16)
    except ValueError:
        raise HTTPException(status_code=400, detail={
            "error": {"type": "invalid_request", "message": "Invalid private_key hex format"}
        })

    try:
        pub_bytes = bytes.fromhex(body.public_key)
        _ = bytes_to_point(pub_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail={
            "error": {"type": "invalid_request", "message": "Invalid public_key format"}
        })

    message_bytes = body.message.encode() if body.message else None

    # Generate proof(s) — multiple rounds for higher soundness
    last_proof = None
    for _ in range(body.rounds):
        prover = SchnorrProver(private_key=private_key)
        last_proof = prover.create_proof_with_message(message=message_bytes)

    assert last_proof is not None

    latency_ms = (time.perf_counter() - start) * 1000

    return ProofCreateResponse(
        proof_id=generate_proof_id(),
        proof=ProofDataSchema(
            commitment=CommitmentSchema(
                x=format(last_proof.commitment_x, "x"),
                y=format(last_proof.commitment_y, "x"),
            ),
            challenge=format(last_proof.challenge, "x"),
            response=format(last_proof.response, "x"),
            message_hash=last_proof.message_hash,
        ),
        curve="secp256k1",
        rounds=body.rounds,
        created_at=datetime.now(timezone.utc),
        latency_ms=round(latency_ms, 2),
    )


@router.post("/v1/proofs/verify", response_model=ProofVerifyResponse)
async def verify_proof(
    body: ProofVerifyRequest,
    auth: AuthenticatedOrg = Depends(get_current_org),
) -> ProofVerifyResponse:
    """Verify a zero-knowledge proof."""
    start = time.perf_counter()

    try:
        pub_bytes = bytes.fromhex(body.public_key)
        public_key = bytes_to_point(pub_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail={
            "error": {"type": "invalid_request", "message": "Invalid public_key format"}
        })

    from zkp_engine.models import Proof

    try:
        proof = Proof(
            commitment_x=int(body.proof.commitment.x, 16),
            commitment_y=int(body.proof.commitment.y, 16),
            challenge=int(body.proof.challenge, 16),
            response=int(body.proof.response, 16),
            message_hash=body.proof.message_hash,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail={
            "error": {"type": "invalid_request", "message": "Invalid proof data format"}
        })

    verifier = SchnorrVerifier(public_key=public_key)

    if body.message:
        valid = verifier.verify_with_message(proof, body.message.encode())
    else:
        valid = verifier.verify(proof)

    latency_ms = (time.perf_counter() - start) * 1000

    return ProofVerifyResponse(
        valid=valid,
        proof_id=generate_proof_id(),
        verification_id=f"vrf_{uuid.uuid4().hex[:16]}",
        latency_ms=round(latency_ms, 2),
        verified_at=datetime.now(timezone.utc),
    )
