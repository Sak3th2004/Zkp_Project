from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from .models import AuthChallenge, Challenge
from .utils import bytes_to_int, generate_challenge_id


class ChallengeGenerator:
    @staticmethod
    def create_challenge(commitment: bytes, public_key: bytes, context: bytes = b"") -> Challenge:
        digest = hashlib.sha256(commitment + public_key + context).digest()
        return Challenge(value=digest)

    @staticmethod
    def create_challenge_scalar(
        commitment: bytes,
        public_key: bytes,
        order: int,
        context: bytes = b"",
    ) -> int:
        return bytes_to_int(
            ChallengeGenerator.create_challenge(commitment, public_key, context=context).value
        ) % order

    @staticmethod
    def create_auth_challenge(ttl_seconds: int = 60) -> AuthChallenge:
        now = datetime.now(timezone.utc)
        expiry = now + timedelta(seconds=max(1, min(ttl_seconds, 300)))
        return AuthChallenge(
            nonce=secrets.token_hex(32),
            expires_at=expiry,
            challenge_id=generate_challenge_id(),
        )

