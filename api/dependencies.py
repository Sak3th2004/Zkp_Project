"""FastAPI dependency injection: DB sessions, Redis, current org resolution."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.api_key import ApiKey
from api.models.database import get_db
from api.models.organization import Organization


@dataclass
class AuthenticatedOrg:
    """Resolved from API key — attached to every authenticated request."""
    org_id: uuid.UUID
    org: Organization
    api_key: ApiKey


async def get_current_org(
    request: Request,
    x_api_key: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedOrg:
    """Resolve the organization from the X-API-Key header.

    Steps:
    1. Extract the key prefix (first 12 chars including 'sk_live_' or 'sk_test_')
    2. Look up API key by prefix
    3. Verify the full key against the stored bcrypt hash
    4. Return the resolved org
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "invalid_api_key", "message": "Missing X-API-Key header"}},
        )

    # Parse prefix: format is sk_{mode}_{32chars} → prefix = first 12 chars
    if len(x_api_key) < 12:
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "invalid_api_key", "message": "Invalid API key format"}},
        )

    key_prefix = x_api_key[:12]

    # Look up by prefix
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_prefix == key_prefix, ApiKey.is_active.is_(True))
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "invalid_api_key", "message": "API key not found or inactive"}},
        )

    # Verify full key hash
    import bcrypt

    if not bcrypt.checkpw(x_api_key.encode(), api_key.key_hash.encode()):
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "invalid_api_key", "message": "Invalid API key"}},
        )

    # Check expiry
    if api_key.expires_at:
        from datetime import datetime, timezone

        if datetime.now(timezone.utc) > api_key.expires_at:
            raise HTTPException(
                status_code=401,
                detail={"error": {"type": "api_key_expired", "message": "API key has expired"}},
            )

    # Resolve org
    org_result = await db.execute(
        select(Organization).where(Organization.id == api_key.org_id, Organization.is_active.is_(True))
    )
    org = org_result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "invalid_api_key", "message": "Organization not found or inactive"}},
        )

    # Update last_used_at
    from datetime import datetime, timezone

    api_key.last_used_at = datetime.now(timezone.utc)
    await db.flush()

    return AuthenticatedOrg(org_id=org.id, org=org, api_key=api_key)
