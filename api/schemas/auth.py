"""Pydantic schemas for authentication challenge-response endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from .proofs import ProofDataSchema


class AuthChallengeRequest(BaseModel):
    public_key: str = Field(..., description="Compressed hex public key")
    session_id: str = Field(..., description="Customer's session identifier")
    ttl_seconds: int = Field(60, ge=1, le=300, description="Challenge expiry in seconds")


class AuthChallengeResponse(BaseModel):
    challenge_id: str
    challenge_nonce: str
    public_key: str
    expires_at: datetime
    ttl_seconds: int


class AuthRespondRequest(BaseModel):
    challenge_id: str
    proof: ProofDataSchema


class AuthRespondSuccessResponse(BaseModel):
    authenticated: bool = True
    challenge_id: str
    session_id: str
    verified_at: datetime
    latency_ms: float


class AuthRespondFailureResponse(BaseModel):
    authenticated: bool = False
    error: str
    message: str
