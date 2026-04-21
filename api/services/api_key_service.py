"""API Key management service — create, revoke, rotate keys."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.api_key import ApiKey


def _generate_api_key(key_type: str = "live") -> tuple[str, str, str]:
    """Generate a new API key.

    Returns (full_key, prefix, bcrypt_hash).
    Format: sk_{type}_{32 random alphanumeric chars}
    """
    random_part = secrets.token_hex(16)  # 32 hex chars
    full_key = f"sk_{key_type}_{random_part}"
    prefix = full_key[:12]
    key_hash = bcrypt.hashpw(full_key.encode(), bcrypt.gensalt()).decode()
    return full_key, prefix, key_hash


async def create_api_key(
    db: AsyncSession,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    name: str,
    key_type: str = "live",
    permissions: list[str] | None = None,
    allowed_ips: list[str] | None = None,
    allowed_origins: list[str] | None = None,
    expires_at: datetime | None = None,
) -> tuple[str, ApiKey]:
    """Create a new API key. Returns (full_key_text, api_key_record).

    The full key text is only available at creation time.
    """
    full_key, prefix, key_hash = _generate_api_key(key_type)

    api_key = ApiKey(
        org_id=org_id,
        created_by=user_id,
        name=name,
        key_prefix=prefix,
        key_hash=key_hash,
        key_type=key_type,
        permissions=permissions or ["proofs:create", "proofs:verify", "keys:generate"],
        allowed_ips=allowed_ips,
        allowed_origins=allowed_origins,
        expires_at=expires_at,
    )
    db.add(api_key)
    await db.flush()

    return full_key, api_key


async def revoke_api_key(
    db: AsyncSession,
    org_id: uuid.UUID,
    key_id: uuid.UUID,
) -> bool:
    """Revoke (deactivate) an API key."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.org_id == org_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        return False

    api_key.is_active = False
    api_key.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return True


async def rotate_api_key(
    db: AsyncSession,
    org_id: uuid.UUID,
    key_id: uuid.UUID,
    user_id: uuid.UUID,
) -> tuple[str, ApiKey] | None:
    """Rotate an API key: revoke the old one and create a new one with the same settings."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.org_id == org_id)
    )
    old_key = result.scalar_one_or_none()
    if not old_key:
        return None

    # Revoke old key
    old_key.is_active = False
    old_key.updated_at = datetime.now(timezone.utc)

    # Create new key with same settings
    full_key, new_key = await create_api_key(
        db=db,
        org_id=org_id,
        user_id=user_id,
        name=old_key.name,
        key_type=old_key.key_type,
        permissions=old_key.permissions,
        allowed_ips=old_key.allowed_ips,
        allowed_origins=old_key.allowed_origins,
    )

    return full_key, new_key


async def list_api_keys(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> list[ApiKey]:
    """List all API keys for an organization."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.org_id == org_id).order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())
