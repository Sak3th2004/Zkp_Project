"""Proof logging service — write audit trail for every API operation."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from api.models.proof_log import ProofLog


async def log_proof_operation(
    db: AsyncSession,
    org_id: uuid.UUID,
    api_key_id: uuid.UUID,
    operation: str,
    status: str,
    latency_ms: float,
    proof_id: str | None = None,
    request_ip: str | None = None,
    user_agent: str | None = None,
    error_message: str | None = None,
    metadata: dict | None = None,
) -> ProofLog:
    """Create an audit log entry for an API operation."""
    log = ProofLog(
        org_id=org_id,
        api_key_id=api_key_id,
        operation=operation,
        status=status,
        proof_id=proof_id,
        latency_ms=latency_ms,
        request_ip=request_ip,
        user_agent=user_agent,
        error_message=error_message,
        metadata_=metadata,
    )
    db.add(log)
    await db.flush()
    return log
