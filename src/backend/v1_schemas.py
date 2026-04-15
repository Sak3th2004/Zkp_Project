from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PublicKeyOut(BaseModel):
    x: str
    y: str
    compressed: str


class KeyGenerateRequest(BaseModel):
    user_id: str | None = None
    metadata: dict[str, Any] | None = None


class KeyGenerateResponse(BaseModel):
    key_id: str
    public_key: PublicKeyOut
    private_key: str
    curve: str = "secp256k1"
    created_at: datetime
    warning: str


class ProofCommitment(BaseModel):
    x: str
    y: str


class ProofPayload(BaseModel):
    commitment: ProofCommitment
    challenge: str
    response: str
    message_hash: str | None = None


class ProofCreateRequest(BaseModel):
    private_key: str
    public_key: str
    message: str | None = None
    rounds: int = Field(default=1, ge=1, le=5)


class ProofCreateResponse(BaseModel):
    proof_id: str
    proof: ProofPayload
    curve: str = "secp256k1"
    rounds: int
    created_at: datetime
    latency_ms: float


class ProofVerifyRequest(BaseModel):
    proof: ProofPayload
    public_key: str
    message: str | None = None


class ProofVerifyResponse(BaseModel):
    valid: bool
    proof_id: str
    verification_id: str
    latency_ms: float
    verified_at: datetime


class AuthChallengeRequest(BaseModel):
    public_key: str
    session_id: str
    ttl_seconds: int = Field(default=60, ge=1, le=300)


class AuthChallengeResponse(BaseModel):
    challenge_id: str
    challenge_nonce: str
    public_key: str
    expires_at: datetime
    ttl_seconds: int


class AuthRespondRequest(BaseModel):
    challenge_id: str
    proof: ProofPayload


class AuthRespondResponse(BaseModel):
    authenticated: bool
    challenge_id: str
    session_id: str | None = None
    verified_at: datetime | None = None
    latency_ms: float | None = None
    error: str | None = None
    message: str | None = None


class UsageBucket(BaseModel):
    used: int
    limit: int | None
    remaining: int | None


class UsageResponse(BaseModel):
    org_id: str
    plan: str
    current_period: str
    usage: dict[str, UsageBucket]
    rate_limit: dict[str, int]

