"""Pydantic schemas for error responses."""

from __future__ import annotations

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    type: str
    message: str
    retry_after: int | None = None
    documentation_url: str | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
    request_id: str | None = None
