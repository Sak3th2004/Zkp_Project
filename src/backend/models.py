"""Pydantic schemas for FastAPI endpoints."""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Sequence

from pydantic import BaseModel, Field

from config import settings
from src.core.hash_utils import sha256_hex


class AppType(str, Enum):
    voting = "voting"
    medical = "medical"
    supply = "supply"
    identity = "identity"
    ml_audit = "ml_audit"
    collab_edit = "collab_edit"


class ProofModel(BaseModel):
    commitment_x: int
    commitment_y: int
    challenge: int
    response: int


class ProofBundle(BaseModel):
    public_key: Sequence[int]
    statement: str
    rounds: int = Field(settings.DEFAULT_ROUNDS, ge=1, le=5)
    proofs: List[ProofModel]
    entropy: float | None = None


class ProveRequest(BaseModel):
    secret: str
    statement: str
    rounds: int = Field(settings.DEFAULT_ROUNDS, ge=1, le=5)
    app_type: AppType
    batch_size: int | None = Field(None, ge=1, le=settings.MAX_BATCH)


class VerifyRequest(BaseModel):
    bundle: ProofBundle


class AdvancedSimRequest(BaseModel):
    app_type: AppType
    payload: Dict[str, Any] | None = None
    rounds: int = Field(settings.DEFAULT_ROUNDS, ge=1, le=5)
    batch_size: int = Field(1000, ge=1, le=settings.MAX_BATCH)


class AdvancedSimResponse(BaseModel):
    chain_valid: bool
    aggregate: Dict[str, Any]
    metrics: Dict[str, float]
    no_leak: bool
    entropy: float


def derive_secret_scalar(secret: str) -> int:
    digest = sha256_hex([secret])
    return int(digest, 16) % settings.CURVE_ORDER
