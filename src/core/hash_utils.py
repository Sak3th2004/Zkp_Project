"""Hash helpers for Schnorr commitments."""
from __future__ import annotations

from typing import Iterable

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend


_BACKEND = default_backend()


def _normalize(segment: bytes | str | int) -> bytes:
    if isinstance(segment, bytes):
        return segment
    if isinstance(segment, int):
        size = max(1, (segment.bit_length() + 7) // 8)
        return segment.to_bytes(size, "big")
    return segment.encode("utf-8")


def sha256_raw(segments: Iterable[bytes | str | int]) -> bytes:
    digest = hashes.Hash(hashes.SHA256(), backend=_BACKEND)
    for part in segments:
        digest.update(_normalize(part))
    return digest.finalize()


def sha256_hex(segments: Iterable[bytes | str]) -> str:
    return sha256_raw(segments).hex()


def challenge_scalar(commitment_bytes: bytes, statement: str, order: int) -> int:
    payload = (commitment_bytes, statement)
    value = int.from_bytes(sha256_raw(payload), "big")
    return value % order
