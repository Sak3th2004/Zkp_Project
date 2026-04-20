"""Authentication challenge-response endpoints."""

from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import AuthenticatedOrg, get_current_org
from api.schemas.auth import (
    AuthChallengeRequest,
    AuthChallengeResponse,
    AuthRespondRequest,
    AuthRespondSuccessResponse,
)
from zkp_engine import ChallengeGenerator, SchnorrVerifier
from zkp_engine.models import Proof
from zkp_engine.utils import bytes_to_point

router = APIRouter(tags=["Auth"])

# In-memory challenge store (in production this would be Redis)
_challenge_store: dict[str, dict] = {}


@router.post("/v1/auth/challenge", response_model=AuthChallengeResponse, status_code=201)
async def create_challenge(
    body: AuthChallengeRequest,
    auth: AuthenticatedOrg = Depends(get_current_org),
) -> AuthChallengeResponse:
    """Start a ZKP authentication flow by creating a challenge."""
    challenge = ChallengeGenerator.create_auth_challenge(ttl_seconds=body.ttl_seconds)

    # Store challenge for later verification
    _challenge_store[challenge.challenge_id] = {
        "nonce": challenge.nonce,
        "public_key": body.public_key,
        "session_id": body.session_id,
        "expires_at": challenge.expires_at,
        "org_id": str(auth.org_id),
    }

    return AuthChallengeResponse(
        challenge_id=challenge.challenge_id,
        challenge_nonce=challenge.nonce,
        public_key=body.public_key,
        expires_at=challenge.expires_at,
        ttl_seconds=body.ttl_seconds,
    )


@router.post("/v1/auth/respond")
async def respond_to_challenge(
    body: AuthRespondRequest,
    auth: AuthenticatedOrg = Depends(get_current_org),
) -> AuthRespondSuccessResponse:
    """Complete ZKP authentication by submitting proof of knowledge."""
    start = time.perf_counter()

    stored = _challenge_store.pop(body.challenge_id, None)
    if not stored:
        raise HTTPException(
            status_code=404,
            detail={"error": {"type": "not_found", "message": "Challenge not found"}},
        )

    # Check expiry
    if datetime.now(timezone.utc) > stored["expires_at"]:
        raise HTTPException(
            status_code=410,
            detail={"error": {"type": "challenge_expired", "message": "Challenge has expired"}},
        )

    # Parse public key
    try:
        pub_bytes = bytes.fromhex(stored["public_key"])
        public_key = bytes_to_point(pub_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail={
            "error": {"type": "invalid_request", "message": "Invalid stored public_key"}
        })

    # Build Proof object
    try:
        proof = Proof(
            commitment_x=int(body.proof.commitment.x, 16),
            commitment_y=int(body.proof.commitment.y, 16),
            challenge=int(body.proof.challenge, 16),
            response=int(body.proof.response, 16),
        )
    except ValueError:
        raise HTTPException(status_code=400, detail={
            "error": {"type": "invalid_request", "message": "Invalid proof data"}
        })

    verifier = SchnorrVerifier(public_key=public_key)
    valid = verifier.verify(proof)

    latency_ms = (time.perf_counter() - start) * 1000

    if not valid:
        raise HTTPException(
            status_code=401,
            detail={
                "authenticated": False,
                "error": "proof_invalid",
                "message": "The submitted proof does not match the challenge",
            },
        )

    return AuthRespondSuccessResponse(
        authenticated=True,
        challenge_id=body.challenge_id,
        session_id=stored["session_id"],
        verified_at=datetime.now(timezone.utc),
        latency_ms=round(latency_ms, 2),
    )
