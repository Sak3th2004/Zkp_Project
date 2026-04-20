"""Pydantic schemas for proof creation and verification endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


# ── Shared ──────────────────────────────────────────────────────────────────

class CommitmentSchema(BaseModel):
    x: str
    y: str


class ProofDataSchema(BaseModel):
    commitment: CommitmentSchema
    challenge: str
    response: str
    message_hash: str | None = None


# ── Create ──────────────────────────────────────────────────────────────────

class ProofCreateRequest(BaseModel):
    private_key: str
    public_key: str = Field(..., description="Compressed hex public key")
    message: str | None = None
    rounds: int = Field(1, ge=1, le=5, description="More rounds = higher soundness")


class ProofCreateResponse(BaseModel):
    proof_id: str
    proof: ProofDataSchema
    curve: str = "secp256k1"
    rounds: int
    created_at: datetime
    latency_ms: float


# ── Verify ──────────────────────────────────────────────────────────────────

class ProofVerifyRequest(BaseModel):
    proof: ProofDataSchema
    public_key: str = Field(..., description="Compressed hex public key")
    message: str | None = None


class ProofVerifyResponse(BaseModel):
    valid: bool
    proof_id: str
    verification_id: str
    latency_ms: float
    verified_at: datetime


# ── Batch ───────────────────────────────────────────────────────────────────

class BatchItemSchema(BaseModel):
    proof: ProofDataSchema | None = None
    public_key: str | None = None
    private_key: str | None = None
    message: str | None = None


class ProofBatchRequest(BaseModel):
    operation: str = Field(..., pattern="^(create|verify)$")
    items: list[BatchItemSchema] = Field(..., max_length=10000)
    webhook_url: str | None = None


class ProofBatchResponse(BaseModel):
    batch_id: str
    status: str = "processing"
    total_items: int
    estimated_completion_seconds: float
    status_url: str


class BatchResultItem(BaseModel):
    index: int
    valid: bool | None = None
    latency_ms: float | None = None
    error: str | None = None
    proof: ProofDataSchema | None = None


class BatchStatusResponse(BaseModel):
    batch_id: str
    status: str
    total_items: int
    successful: int
    failed: int
    results: list[BatchResultItem]
    completed_at: datetime | None = None
