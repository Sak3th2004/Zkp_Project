from __future__ import annotations

import secrets
from dataclasses import asdict

from ecdsa import curves

from .models import KeyPair as KeyPairModel

SECP256K1 = curves.SECP256k1


class KeyPair:
    def __init__(self, private_key: int, public_key: tuple[int, int]):
        self.private_key = private_key
        self.public_key = public_key

    @classmethod
    def generate(cls) -> "KeyPair":
        order = SECP256K1.order
        private_key = secrets.randbelow(order - 1) + 1
        point = private_key * SECP256K1.generator
        return cls(private_key=private_key, public_key=(int(point.x()), int(point.y())))

    @classmethod
    def from_hex(cls, private_key_hex: str) -> "KeyPair":
        private_key = int(private_key_hex, 16)
        point = private_key * SECP256K1.generator
        return cls(private_key=private_key, public_key=(int(point.x()), int(point.y())))

    def to_hex(self) -> dict[str, str]:
        return {
            "private_key": format(self.private_key, "x"),
            "public_key_x": format(self.public_key[0], "x"),
            "public_key_y": format(self.public_key[1], "x"),
        }

    def to_dict(self) -> dict[str, int]:
        model = KeyPairModel(
            private_key=self.private_key,
            public_key_x=self.public_key[0],
            public_key_y=self.public_key[1],
        )
        return asdict(model)

