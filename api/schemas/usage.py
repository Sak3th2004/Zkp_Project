"""Pydantic schemas for usage endpoint."""

from __future__ import annotations

from pydantic import BaseModel


class UsageMeter(BaseModel):
    used: int
    limit: int | None
    remaining: int | None


class RateLimitInfo(BaseModel):
    requests_per_minute: int
    current_minute_usage: int


class UsageData(BaseModel):
    proof_creates: UsageMeter
    proof_verifies: UsageMeter
    key_generates: UsageMeter


class UsageResponse(BaseModel):
    org_id: str
    plan: str
    current_period: str
    usage: UsageData
    rate_limit: RateLimitInfo
