"""Dashboard authentication routes (JWT-based login/signup)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.models.database import get_db
from api.models.organization import Organization
from api.models.user import User
from api.schemas.dashboard_auth import LoginRequest, SignupRequest, TokenResponse, UserInfo

router = APIRouter(prefix="/dashboard", tags=["Dashboard Auth"])


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _create_token(user_id: str, org_id: str) -> str:
    payload = {
        "sub": user_id,
        "org_id": org_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(
    body: SignupRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new user and organization."""
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create organization
    slug = body.organization_name.lower().replace(" ", "-")[:100]
    # Ensure slug uniqueness
    slug_check = await db.execute(select(Organization).where(Organization.slug == slug))
    if slug_check.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    org = Organization(name=body.organization_name, slug=slug)
    db.add(org)
    await db.flush()

    # Create user as owner
    user = User(
        org_id=org.id,
        email=body.email,
        password_hash=_hash_password(body.password),
        full_name=body.full_name,
        role="owner",
    )
    db.add(user)
    await db.flush()

    token = _create_token(str(user.id), str(org.id))
    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRY_HOURS * 3600,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login with email and password, returns JWT."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    token = _create_token(str(user.id), str(user.org_id))
    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRY_HOURS * 3600,
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user(
    # TODO: add JWT dependency injection
    db: AsyncSession = Depends(get_db),
) -> UserInfo:
    """Get current authenticated user info."""
    raise HTTPException(status_code=501, detail="Not implemented yet")
