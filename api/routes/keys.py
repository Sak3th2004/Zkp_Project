"""Key generation endpoint — POST /v1/keys/generate."""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import AuthenticatedOrg, get_current_org
from api.models.database import get_db
from api.schemas.keys import KeyGenerateRequest, KeyGenerateResponse, PublicKeyResponse
from api.services.proof_logger import log_proof_operation
from api.services.usage_service import check_usage_limit, increment_usage
from zkp_engine import KeyPair
from zkp_engine.utils import point_to_bytes

router = APIRouter(tags=["Keys"])


@router.post("/v1/keys/generate", response_model=KeyGenerateResponse, status_code=201)
async def generate_key_pair(
    body: KeyGenerateRequest,
    request: Request,
    auth: AuthenticatedOrg = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> KeyGenerateResponse:
    """Generate a new ZKP key pair on secp256k1.

    The private key is returned **once** and never stored on our side.
    """
    start = time.perf_counter()

    # Check usage limit
    allowed, current, limit = await check_usage_limit(db, auth.org, "key_generate")
    if not allowed:
        raise HTTPException(status_code=402, detail={
            "error": {"type": "usage_limit_exceeded", "message": f"Monthly proof limit reached ({current}/{limit})"}
        })

    kp = KeyPair.generate()
    hex_data = kp.to_hex()
    compressed = point_to_bytes(kp.public_key[0], kp.public_key[1]).hex()
    latency_ms = (time.perf_counter() - start) * 1000

    # Track usage + audit log
    await increment_usage(db, auth.org_id, "key_generate")
    await log_proof_operation(
        db, org_id=auth.org_id, api_key_id=auth.api_key.id,
        operation="key_generate", status="success", latency_ms=round(latency_ms, 2),
        request_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return KeyGenerateResponse(
        key_id=f"kp_{uuid.uuid4().hex[:16]}",
        public_key=PublicKeyResponse(
            x=hex_data["public_key_x"],
            y=hex_data["public_key_y"],
            compressed=compressed,
        ),
        private_key=hex_data["private_key"],
        curve="secp256k1",
        created_at=datetime.now(timezone.utc),
    )
