"""Usage tracking service — increment and check monthly usage counters."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.organization import Organization
from api.models.usage_counter import UsageCounter


async def get_or_create_counter(db: AsyncSession, org_id, period: str) -> UsageCounter:
    """Get the usage counter for the given org+period, or create one."""
    result = await db.execute(
        select(UsageCounter).where(
            UsageCounter.org_id == org_id,
            UsageCounter.period == period,
        )
    )
    counter = result.scalar_one_or_none()

    if not counter:
        counter = UsageCounter(org_id=org_id, period=period)
        db.add(counter)
        await db.flush()

    return counter


async def increment_usage(
    db: AsyncSession,
    org_id,
    operation: str,
) -> UsageCounter:
    """Increment the usage counter for the current month."""
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    counter = await get_or_create_counter(db, org_id, period)

    if operation == "proof_create":
        counter.proof_create_count += 1
    elif operation == "proof_verify":
        counter.proof_verify_count += 1
    elif operation == "key_generate":
        counter.key_generate_count += 1
    elif operation == "auth_challenge":
        counter.auth_challenge_count += 1

    await db.flush()
    return counter


async def check_usage_limit(
    db: AsyncSession,
    org: Organization,
    operation: str,
) -> tuple[bool, int, int]:
    """Check if the org has exceeded its monthly limit for the given operation.

    Returns (allowed, current_count, limit).
    """
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    counter = await get_or_create_counter(db, org.id, period)

    if operation in ("proof_create", "key_generate"):
        return (
            counter.proof_create_count < org.monthly_proof_limit,
            counter.proof_create_count,
            org.monthly_proof_limit,
        )
    elif operation == "proof_verify":
        return (
            counter.proof_verify_count < org.monthly_verify_limit,
            counter.proof_verify_count,
            org.monthly_verify_limit,
        )

    return True, 0, 0
