from __future__ import annotations

import hmac
import uuid

from ecdsa import VerifyingKey, curves, ellipticcurve

SECP256K1 = curves.SECP256k1


def int_to_bytes(n: int, length: int = 32) -> bytes:
    return n.to_bytes(length, "big")


def bytes_to_int(data: bytes) -> int:
    return int.from_bytes(data, "big")


def point_to_bytes(x: int, y: int) -> bytes:
    prefix = b"\x02" if y % 2 == 0 else b"\x03"
    return prefix + int_to_bytes(x, 32)


def bytes_to_point(data: bytes) -> tuple[int, int]:
    verifying_key = VerifyingKey.from_string(data, curve=SECP256K1, valid_encodings={"compressed"})
    point = verifying_key.pubkey.point
    return int(point.x()), int(point.y())


def point_from_xy(x: int, y: int) -> ellipticcurve.Point:
    return ellipticcurve.Point(SECP256K1.curve, x, y, SECP256K1.order)


def generate_proof_id() -> str:
    return f"prf_{uuid.uuid4().hex[:16]}"


def generate_challenge_id() -> str:
    return f"ch_{uuid.uuid4().hex[:12]}"


def timing_safe_compare(a: bytes, b: bytes) -> bool:
    return hmac.compare_digest(a, b)

