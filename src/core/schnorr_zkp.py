"""Schnorr proof system on secp256k1 with SHA-256 commitments."""
from __future__ import annotations

import math
import secrets
from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np
from scipy.stats import entropy
from py_ecc.secp256k1 import secp256k1

from config import settings
from .hash_utils import challenge_scalar

Point = tuple[int, int]


@dataclass(slots=True)
class Proof:
    commitment_x: int
    commitment_y: int
    challenge: int
    response: int

    def as_dict(self) -> dict[str, int]:
        return {
            "commitment_x": self.commitment_x,
            "commitment_y": self.commitment_y,
            "challenge": self.challenge,
            "response": self.response,
        }


def _random_scalar() -> int:
    return secrets.randbelow(settings.CURVE_ORDER - 1) + 1


def _mul(point: Point, scalar: int) -> Point:
    return secp256k1.multiply(point, scalar % settings.CURVE_ORDER)


def _pubkey(secret: int) -> Point:
    return _mul(settings.GENERATOR, secret)


def _serialize_point(point: Point) -> bytes:
    return point[0].to_bytes(32, "big")


def prove_once(secret: int, statement: str) -> Proof:
    key = secret % settings.CURVE_ORDER
    nonce = _random_scalar()
    commitment = _mul(settings.GENERATOR, nonce)
    challenge = challenge_scalar(_serialize_point(commitment), statement, settings.CURVE_ORDER)
    response = (nonce + challenge * key) % settings.CURVE_ORDER
    return Proof(commitment[0], commitment[1], challenge, response)


def verify_once(public_key: Point, statement: str, proof: Proof) -> bool:
    lhs = _mul(settings.GENERATOR, proof.response)
    rhs = secp256k1.add(_mul(public_key, proof.challenge), (proof.commitment_x, proof.commitment_y))
    return lhs == rhs


def multi_round(secret: int, statement: str, rounds: int = settings.DEFAULT_ROUNDS) -> dict:
    proofs = [prove_once(secret, statement) for _ in range(rounds)]
    bundle = {
        "public_key": list(_pubkey(secret)),
        "proofs": [proof.as_dict() for proof in proofs],
        "statement": statement,
        "rounds": rounds,
    }
    bundle["entropy"] = transcript_entropy(bundle["proofs"])
    return bundle


def _chunked(iterable: Sequence, chunk: int) -> Iterable[Sequence]:
    for idx in range(0, len(iterable), chunk):
        yield iterable[idx : idx + chunk]


def batch_prove(secrets: Sequence[int], statements: Sequence[str], rounds: int = settings.DEFAULT_ROUNDS) -> list[dict]:
    if len(secrets) != len(statements):
        raise ValueError("Secret and statement counts differ")
    batches = []
    for secret_batch, statement_batch in zip(_chunked(list(secrets), 1000), _chunked(list(statements), 1000)):
        secret_array = np.array(secret_batch, dtype=object)
        statement_array = np.array(statement_batch, dtype=object)
        for secret, statement in zip(secret_array, statement_array):
            batches.append(multi_round(int(secret), str(statement), rounds))
    return batches


def batch_verify(bundles: Sequence[dict]) -> bool:
    for bundle in bundles:
        public_key = tuple(bundle["public_key"])
        for proof_data in bundle["proofs"]:
            proof = Proof(**proof_data)
            if not verify_once(public_key, bundle["statement"], proof):
                return False
    return True


def simulate(statement: str, rounds: int) -> list[dict[str, int]]:
    sims: list[dict[str, int]] = []
    for _ in range(rounds):
        fake_commitment = _mul(settings.GENERATOR, _random_scalar())
        challenge = secrets.randbelow(settings.CURVE_ORDER - 1) + 1
        response = _random_scalar()
        sims.append(
            Proof(fake_commitment[0], fake_commitment[1], challenge, response).as_dict()
        )
    return sims


def transcript_entropy(proofs: Sequence[dict[str, int]]) -> float:
    if not proofs:
        return 0.0
    data = np.array([p["challenge"] for p in proofs], dtype=np.float64)
    if np.ptp(data) == 0:
        return 0.0
    bins = min(max(int(math.sqrt(len(data))), 2), 128)
    hist, _ = np.histogram(data, bins=bins, density=True)
    hist = hist[hist > 0]
    if not hist.size:
        return 0.0
    return float(entropy(hist))
