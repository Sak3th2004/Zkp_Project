"""Key generation endpoint — POST /v1/keys/generate."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from api.dependencies import AuthenticatedOrg, get_current_org
from api.schemas.keys import KeyGenerateRequest, KeyGenerateResponse, PublicKeyResponse
from zkp_engine import KeyPair
from zkp_engine.utils import point_to_bytes

router = APIRouter(tags=["Keys"])


@router.post("/v1/keys/generate", response_model=KeyGenerateResponse, status_code=201)
async def generate_key_pair(
    body: KeyGenerateRequest,
    auth: AuthenticatedOrg = Depends(get_current_org),
) -> KeyGenerateResponse:
    """Generate a new ZKP key pair on secp256k1.

    The private key is returned **once** and never stored on our side.
    """
    kp = KeyPair.generate()
    hex_data = kp.to_hex()

    compressed = point_to_bytes(kp.public_key[0], kp.public_key[1]).hex()

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
