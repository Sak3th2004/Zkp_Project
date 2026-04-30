"""Pydantic schemas for ZKP-based dashboard authentication."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


# ── ZKP Signup (no password!) ─────────────────────────────────────

class ZKPSignupRequest(BaseModel):
    """User registers with name + email + public key (generated in browser)."""
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    organization_name: str = Field(..., min_length=1, max_length=255)
    public_key: str = Field(..., min_length=60, max_length=130, description="Compressed secp256k1 public key (hex)")


# ── ZKP Login — Step 1: Request challenge ─────────────────────────

class ZKPLoginChallengeRequest(BaseModel):
    """User provides email, server returns a challenge nonce."""
    email: EmailStr


class ZKPLoginChallengeResponse(BaseModel):
    """Server returns a challenge for the user to sign."""
    challenge_id: str
    challenge_nonce: str
    public_key: str
    expires_in: int = 60


# ── ZKP Login — Step 2: Prove identity ───────────────────────────

class ZKPLoginProofRequest(BaseModel):
    """User submits Schnorr proof signed with their private key."""
    challenge_id: str
    proof: ZKPProofData


class ZKPProofData(BaseModel):
    """Schnorr proof components."""
    commitment_x: str
    commitment_y: str
    challenge: str
    response: str
    message_hash: str | None = None


# ── Responses ────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str
    org_id: str
    org_name: str
    plan: str
    auth_method: str = "zkp"
    public_key: str | None = None


# ── Legacy password schemas (kept for backward compat) ───────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    organization_name: str = Field(..., min_length=1, max_length=255)
