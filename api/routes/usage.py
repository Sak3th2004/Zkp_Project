"""Usage metrics endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import AuthenticatedOrg, get_current_org
from api.models.database import get_db
from api.models.usage_counter import UsageCounter
from api.schemas.usage import RateLimitInfo, UsageData, UsageMeter, UsageResponse

router = APIRouter(tags=["Usage"])


@router.get("/v1/usage", response_model=UsageResponse)
async def get_usage(
    auth: AuthenticatedOrg = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> UsageResponse:
    """Get current usage metrics for the authenticated organization."""
    current_period = datetime.now(timezone.utc).strftime("%Y-%m")

    result = await db.execute(
        select(UsageCounter).where(
            UsageCounter.org_id == auth.org_id,
            UsageCounter.period == current_period,
        )
    )
    counter = result.scalar_one_or_none()

    proof_used = counter.proof_create_count if counter else 0
    verify_used = counter.proof_verify_count if counter else 0
    key_used = counter.key_generate_count if counter else 0

    proof_limit = auth.org.monthly_proof_limit
    verify_limit = auth.org.monthly_verify_limit

    return UsageResponse(
        org_id=str(auth.org_id),
        plan=auth.org.plan,
        current_period=current_period,
        usage=UsageData(
            proof_creates=UsageMeter(
                used=proof_used,
                limit=proof_limit,
                remaining=max(0, proof_limit - proof_used) if proof_limit else None,
            ),
            proof_verifies=UsageMeter(
                used=verify_used,
                limit=verify_limit,
                remaining=max(0, verify_limit - verify_used) if verify_limit else None,
            ),
            key_generates=UsageMeter(
                used=key_used,
                limit=None,
                remaining=None,
            ),
        ),
        rate_limit=RateLimitInfo(
            requests_per_minute=auth.org.rate_limit_per_minute,
            current_minute_usage=0,  # TODO: read from Redis
        ),
    )
