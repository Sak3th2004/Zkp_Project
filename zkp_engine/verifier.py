from __future__ import annotations

import hashlib

from ecdsa import curves

from .challenge import ChallengeGenerator
from .models import Proof
from .utils import point_from_xy, point_to_bytes

SECP256K1 = curves.SECP256k1


class SchnorrVerifier:
    def __init__(self, public_key: tuple[int, int]):
        self.order = SECP256K1.order
        self.generator = SECP256K1.generator
        self.public_key = public_key
        self.public_point = point_from_xy(*public_key)

    def verify(self, proof: Proof) -> bool:
        return self._verify(proof=proof, message=None)

    def verify_with_message(self, proof: Proof, message: bytes) -> bool:
        expected = ChallengeGenerator.create_challenge_scalar(
            commitment=point_to_bytes(proof.commitment_x, proof.commitment_y),
            public_key=point_to_bytes(*self.public_key),
            order=self.order,
            context=message,
        )
        message_hash = hashlib.sha256(message).hexdigest()
        if expected != proof.challenge:
            return False
        if proof.message_hash is not None and proof.message_hash != message_hash:
            return False
        return self._verify(proof=proof, message=message)

    def _verify(self, proof: Proof, message: bytes | None) -> bool:
        try:
            commitment = point_from_xy(proof.commitment_x, proof.commitment_y)
        except Exception:
            return False
        lhs = proof.response * self.generator + proof.challenge * self.public_point
        return lhs == commitment

