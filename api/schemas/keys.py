"""Pydantic schemas for key generation endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class KeyGenerateRequest(BaseModel):
    user_id: str | None = Field(None, description="Customer's user identifier for tracking")
    metadata: dict | None = Field(None, description="Arbitrary metadata")


class PublicKeyResponse(BaseModel):
    x: str
    y: str
    compressed: str


class KeyGenerateResponse(BaseModel):
    key_id: str
    public_key: PublicKeyResponse
    private_key: str = Field(..., description="ONLY returned once, never stored on our side")
    curve: str = "secp256k1"
    created_at: datetime
    warning: str = "Store the private_key securely. It cannot be retrieved again."
