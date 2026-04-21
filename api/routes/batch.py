"""Batch proof processing endpoint — queues to Celery."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.dependencies import AuthenticatedOrg, get_current_org
from api.models.database import get_db
from api.schemas.proofs import ProofBatchRequest, ProofBatchResponse
from api.services.usage_service import check_usage_limit

router = APIRouter(tags=["Proofs"])


@router.post("/v1/proofs/batch", response_model=ProofBatchResponse, status_code=202)
async def batch_proofs(
    body: ProofBatchRequest,
    request: Request,
    auth: AuthenticatedOrg = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ProofBatchResponse:
    """Submit a batch of proof operations for async processing.

    Returns immediately with a batch_id. Results delivered via webhook or polling.
    """
    if len(body.items) == 0:
        raise HTTPException(status_code=400, detail={
            "error": {"type": "invalid_request", "message": "Batch must contain at least 1 item"}
        })

    # Check usage limit
    op = "proof_create" if body.operation == "create" else "proof_verify"
    allowed, current, limit = await check_usage_limit(db, auth.org, op)
    if not allowed:
        raise HTTPException(status_code=402, detail={
            "error": {"type": "usage_limit_exceeded", "message": f"Monthly limit reached ({current}/{limit})"}
        })

    batch_id = f"batch_{uuid.uuid4().hex[:16]}"

    # Queue to Celery
    from api.tasks.batch_tasks import batch_proof_process
    batch_proof_process.delay(
        batch_id=batch_id,
        operation=body.operation,
        items=[item.model_dump() for item in body.items],
        webhook_url=body.webhook_url,
    )

    estimated_seconds = len(body.items) * 0.01  # ~10ms per item

    return ProofBatchResponse(
        batch_id=batch_id,
        status="processing",
        total_items=len(body.items),
        estimated_completion_seconds=round(estimated_seconds, 1),
        status_url=f"{settings.APP_URL}/v1/proofs/batch/{batch_id}",
    )
