from __future__ import annotations

import pytest

from src.core import schnorr_zkp as zkp


def test_schnorr_rounds_verify():
    bundle = zkp.multi_round(123456789, "core-statement", rounds=3)
    assert zkp.batch_verify([bundle])


def test_transcript_entropy_bounds():
    bundle = zkp.multi_round(55555, "entropy", rounds=3)
    entropy = zkp.transcript_entropy(bundle["proofs"])
    assert entropy >= 0
    assert isinstance(entropy, float)
