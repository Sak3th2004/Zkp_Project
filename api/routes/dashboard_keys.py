"""Dashboard API key management routes (JWT-protected)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies_jwt import CurrentUser, get_current_user
from api.models.database import get_db
from api.services.api_key_service import create_api_key, list_api_keys, revoke_api_key, rotate_api_key

router = APIRouter(prefix="/dashboard", tags=["Dashboard API Keys"])


class CreateKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    key_type: str = Field("live", pattern="^(live|test)$")
    permissions: list[str] | None = None
    allowed_ips: list[str] | None = None
    allowed_origins: list[str] | None = None


class KeyResponse(BaseModel):
    id: str
    name: str
    prefix: str
    key_type: str
    permissions: list[str]
    is_active: bool
    created_at: str
    last_used_at: str | None


class CreateKeyResponse(BaseModel):
    key: str  # Full key — returned only once
    api_key: KeyResponse


@router.post("/keys", response_model=CreateKeyResponse, status_code=201)
async def dashboard_create_key(
    body: CreateKeyRequest,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CreateKeyResponse:
    """Create a new API key for the organization."""
    full_key, api_key = await create_api_key(
        db=db,
        org_id=current.org_id,
        user_id=current.user_id,
        name=body.name,
        key_type=body.key_type,
        permissions=body.permissions,
        allowed_ips=body.allowed_ips,
        allowed_origins=body.allowed_origins,
    )

    return CreateKeyResponse(
        key=full_key,
        api_key=KeyResponse(
            id=str(api_key.id),
            name=api_key.name,
            prefix=api_key.key_prefix,
            key_type=api_key.key_type,
            permissions=api_key.permissions,
            is_active=api_key.is_active,
            created_at=api_key.created_at.isoformat(),
            last_used_at=api_key.last_used_at.isoformat() if api_key.last_used_at else None,
        ),
    )


@router.get("/keys", response_model=list[KeyResponse])
async def dashboard_list_keys(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[KeyResponse]:
    """List all API keys for the organization."""
    keys = await list_api_keys(db, current.org_id)
    return [
        KeyResponse(
            id=str(k.id),
            name=k.name,
            prefix=k.key_prefix,
            key_type=k.key_type,
            permissions=k.permissions,
            is_active=k.is_active,
            created_at=k.created_at.isoformat(),
            last_used_at=k.last_used_at.isoformat() if k.last_used_at else None,
        )
        for k in keys
    ]


@router.delete("/keys/{key_id}", status_code=204)
async def dashboard_revoke_key(
    key_id: UUID,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Revoke (deactivate) an API key."""
    success = await revoke_api_key(db, current.org_id, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")


@router.post("/keys/{key_id}/rotate", response_model=CreateKeyResponse)
async def dashboard_rotate_key(
    key_id: UUID,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CreateKeyResponse:
    """Rotate an API key: revoke old, create new with same settings."""
    result = await rotate_api_key(db, current.org_id, key_id, current.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="API key not found")

    full_key, new_key = result
    return CreateKeyResponse(
        key=full_key,
        api_key=KeyResponse(
            id=str(new_key.id),
            name=new_key.name,
            prefix=new_key.key_prefix,
            key_type=new_key.key_type,
            permissions=new_key.permissions,
            is_active=new_key.is_active,
            created_at=new_key.created_at.isoformat(),
            last_used_at=None,
        ),
    )
