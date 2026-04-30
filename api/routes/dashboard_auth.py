"""Dashboard authentication routes — REAL ZKP-based (no passwords).

Flow:
  SIGNUP: Browser generates secp256k1 key pair → sends public_key + name/email
  LOGIN:  Browser requests challenge → signs with private key → server verifies Schnorr proof
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.dependencies_jwt import CurrentUser
from api.dependencies_jwt import get_current_user as get_current_user_dep
from api.models.database import get_db
from api.models.organization import Organization
from api.models.user import User
from api.schemas.dashboard_auth import (
    TokenResponse,
    UserInfo,
    ZKPLoginChallengeRequest,
    ZKPLoginChallengeResponse,
    ZKPLoginProofRequest,
    ZKPSignupRequest,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard Auth"])

# ── In-memory challenge store (production: use Redis) ────────────
_active_challenges: dict[str, dict] = {}


def _create_token(user_id: str, org_id: str) -> str:
    payload = {
        "sub": user_id,
        "org_id": org_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# ── ZKP Signup ───────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse, status_code=201)
async def zkp_signup(
    body: ZKPSignupRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register with ZKP — no password needed. Browser sends the public key."""
    # Validate public key format (compressed secp256k1 = 66 hex chars starting with 02 or 03)
    pk = body.public_key.strip()
    if len(pk) != 66 or pk[:2] not in ("02", "03"):
        raise HTTPException(status_code=400, detail="Invalid public key format. Expected compressed secp256k1 (66 hex chars, starts with 02 or 03).")

    try:
        int(pk, 16)
    except ValueError:
        raise HTTPException(status_code=400, detail="Public key must be valid hexadecimal.")

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Check public key uniqueness
    pk_check = await db.execute(select(User).where(User.public_key == pk))
    if pk_check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This public key is already registered")

    # Create organization
    slug = body.organization_name.lower().replace(" ", "-")[:100]
    slug_check = await db.execute(select(Organization).where(Organization.slug == slug))
    if slug_check.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    org = Organization(name=body.organization_name, slug=slug)
    db.add(org)
    await db.flush()

    # Create user with public key (NO password)
    user = User(
        org_id=org.id,
        email=body.email,
        public_key=pk,
        password_hash=None,
        full_name=body.full_name,
        role="owner",
        auth_method="zkp",
    )
    db.add(user)
    await db.flush()

    token = _create_token(str(user.id), str(org.id))
    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRY_HOURS * 3600,
    )


# ── ZKP Login — Step 1: Challenge ───────────────────────────────

@router.post("/login/challenge", response_model=ZKPLoginChallengeResponse)
async def zkp_login_challenge(
    body: ZKPLoginChallengeRequest,
    db: AsyncSession = Depends(get_db),
) -> ZKPLoginChallengeResponse:
    """Request a challenge nonce for ZKP login."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.public_key:
        raise HTTPException(status_code=404, detail="No account found with this email")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Generate challenge
    challenge_id = f"ch_{uuid.uuid4().hex}"
    challenge_nonce = secrets.token_hex(32)

    # Store challenge (expires in 60s)
    _active_challenges[challenge_id] = {
        "nonce": challenge_nonce,
        "user_id": str(user.id),
        "org_id": str(user.org_id),
        "public_key": user.public_key,
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=60),
    }

    # Clean expired challenges
    now = datetime.now(timezone.utc)
    expired = [k for k, v in _active_challenges.items() if v["expires_at"] < now]
    for k in expired:
        del _active_challenges[k]

    return ZKPLoginChallengeResponse(
        challenge_id=challenge_id,
        challenge_nonce=challenge_nonce,
        public_key=user.public_key,
        expires_in=60,
    )


# ── ZKP Login — Step 2: Verify proof ────────────────────────────

@router.post("/login/verify", response_model=TokenResponse)
async def zkp_login_verify(
    body: ZKPLoginProofRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Verify the Schnorr proof and issue JWT."""
    challenge_data = _active_challenges.pop(body.challenge_id, None)

    if not challenge_data:
        raise HTTPException(status_code=410, detail="Challenge not found or expired")

    if challenge_data["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Challenge expired")

    # Verify the Schnorr proof using our ZKP engine
    try:
        from zkp_engine.verifier import SchnorrVerifier
        from zkp_engine.models import Proof
        from zkp_engine.utils import bytes_to_point

        # Reconstruct public key point from compressed hex
        pk_hex = challenge_data["public_key"]
        pk_bytes = bytes.fromhex(pk_hex)
        pub_point = bytes_to_point(pk_bytes)

        # Reconstruct proof
        proof = Proof(
            commitment_x=int(body.proof.commitment_x, 16),
            commitment_y=int(body.proof.commitment_y, 16),
            challenge=int(body.proof.challenge, 16),
            response=int(body.proof.response, 16),
            message_hash=body.proof.message_hash,
        )

        # Verify with challenge nonce as message
        message = challenge_data["nonce"].encode()
        verifier = SchnorrVerifier(pub_point)
        valid = verifier.verify_with_message(proof, message=message)

        if not valid:
            raise HTTPException(status_code=401, detail="Proof verification failed — identity not confirmed")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Proof verification error: {str(e)}")

    # Update last login
    result = await db.execute(select(User).where(User.id == uuid.UUID(challenge_data["user_id"])))
    user = result.scalar_one_or_none()
    if user:
        user.last_login_at = datetime.now(timezone.utc)
        await db.flush()

    token = _create_token(challenge_data["user_id"], challenge_data["org_id"])
    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRY_HOURS * 3600,
    )


# ── Get current user ────────────────────────────────────────────

@router.get("/me", response_model=UserInfo)
async def get_me(
    current: "CurrentUser" = Depends(get_current_user_dep),
) -> UserInfo:
    """Get current authenticated user info."""
    return UserInfo(
        id=str(current.user.id),
        email=current.user.email,
        full_name=current.user.full_name,
        role=current.user.role,
        org_id=str(current.org.id),
        org_name=current.org.name,
        plan=current.org.plan,
        auth_method=current.user.auth_method,
        public_key=current.user.public_key,
    )
