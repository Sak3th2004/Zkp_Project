from __future__ import annotations

import hashlib
import secrets

from ecdsa import curves

from .challenge import ChallengeGenerator
from .models import Proof
from .utils import point_to_bytes

SECP256K1 = curves.SECP256k1


class SchnorrProver:
    def __init__(self, private_key: int):
        self.order = SECP256K1.order
        self.generator = SECP256K1.generator
        self.private_key = private_key % self.order
        self.public_key_point = self.private_key * self.generator
        self._nonce: int | None = None
        self._commitment: tuple[int, int] | None = None

    @property
    def public_key(self) -> tuple[int, int]:
        return int(self.public_key_point.x()), int(self.public_key_point.y())

    def create_commitment(self) -> tuple[int, int]:
        self._nonce = secrets.randbelow(self.order - 1) + 1
        commitment = self._nonce * self.generator
        self._commitment = (int(commitment.x()), int(commitment.y()))
        return self._commitment

    def create_proof(self, challenge: bytes | None = None) -> Proof:
        return self.create_proof_with_message(message=None, challenge=challenge)

    def create_proof_with_message(
        self,
        message: bytes | None,
        challenge: bytes | None = None,
    ) -> Proof:
        commitment = self._commitment or self.create_commitment()
        nonce = self._nonce
        if nonce is None:
            raise ValueError("Nonce not initialized")

        commitment_bytes = point_to_bytes(*commitment)
        public_key_bytes = point_to_bytes(*self.public_key)
        context = message or b""
        challenge_scalar = (
            int.from_bytes(challenge, "big") % self.order
            if challenge is not None
            else ChallengeGenerator.create_challenge_scalar(
                commitment=commitment_bytes,
                public_key=public_key_bytes,
                order=self.order,
                context=context,
            )
        )
        response = (nonce - (challenge_scalar * self.private_key)) % self.order
        message_hash = hashlib.sha256(message).hexdigest() if message else None
        return Proof(
            commitment_x=commitment[0],
            commitment_y=commitment[1],
            challenge=challenge_scalar,
            response=response,
            message_hash=message_hash,
        )

