"""Proof create, verify, and batch endpoints."""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import AuthenticatedOrg, get_current_org
from api.models.database import get_db
from api.schemas.proofs import (
    CommitmentSchema,
    ProofCreateRequest,
    ProofCreateResponse,
    ProofDataSchema,
    ProofVerifyRequest,
    ProofVerifyResponse,
)
from api.services.proof_logger import log_proof_operation
from api.services.usage_service import check_usage_limit, increment_usage
from zkp_engine import SchnorrProver, SchnorrVerifier
from zkp_engine.utils import bytes_to_point, generate_proof_id

router = APIRouter(tags=["Proofs"])


@router.post("/v1/proofs/create", response_model=ProofCreateResponse, status_code=201)
async def create_proof(
    body: ProofCreateRequest,
    request: Request,
    auth: AuthenticatedOrg = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ProofCreateResponse:
    """Generate a zero-knowledge proof."""
    start = time.perf_counter()

    # Check usage limit
    allowed, current, limit = await check_usage_limit(db, auth.org, "proof_create")
    if not allowed:
        raise HTTPException(status_code=402, detail={
            "error": {"type": "usage_limit_exceeded", "message": f"Monthly proof limit reached ({current}/{limit})"}
        })

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
    proof_id = generate_proof_id()

    # Track usage + audit log
    await increment_usage(db, auth.org_id, "proof_create")
    await log_proof_operation(
        db, org_id=auth.org_id, api_key_id=auth.api_key.id,
        operation="proof_create", status="success", latency_ms=round(latency_ms, 2),
        proof_id=proof_id,
        request_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return ProofCreateResponse(
        proof_id=proof_id,
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
    request: Request,
    auth: AuthenticatedOrg = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ProofVerifyResponse:
    """Verify a zero-knowledge proof."""
    start = time.perf_counter()

    # Check usage limit
    allowed, current, limit = await check_usage_limit(db, auth.org, "proof_verify")
    if not allowed:
        raise HTTPException(status_code=402, detail={
            "error": {"type": "usage_limit_exceeded", "message": f"Monthly verify limit reached ({current}/{limit})"}
        })

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
    proof_id = generate_proof_id()

    # Track usage + audit log
    await increment_usage(db, auth.org_id, "proof_verify")
    await log_proof_operation(
        db, org_id=auth.org_id, api_key_id=auth.api_key.id,
        operation="proof_verify", status="success" if valid else "failure",
        latency_ms=round(latency_ms, 2), proof_id=proof_id,
        request_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return ProofVerifyResponse(
        valid=valid,
        proof_id=proof_id,
        verification_id=f"vrf_{uuid.uuid4().hex[:16]}",
        latency_ms=round(latency_ms, 2),
        verified_at=datetime.now(timezone.utc),
    )
