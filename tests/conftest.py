"""Shared test fixtures for the ZKProofAPI test suite."""

from __future__ import annotations

import pytest
from zkp_engine import KeyPair, SchnorrProver, SchnorrVerifier


@pytest.fixture
def key_pair() -> KeyPair:
    """Generate a fresh secp256k1 key pair for testing."""
    return KeyPair.generate()


@pytest.fixture
def prover(key_pair: KeyPair) -> SchnorrProver:
    """Create a SchnorrProver from the test key pair."""
    return SchnorrProver(private_key=key_pair.private_key)


@pytest.fixture
def verifier(key_pair: KeyPair) -> SchnorrVerifier:
    """Create a SchnorrVerifier from the test key pair's public key."""
    return SchnorrVerifier(public_key=key_pair.public_key)
