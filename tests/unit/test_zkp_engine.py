"""Unit tests for the ZKP cryptographic engine."""

from __future__ import annotations

import pytest
from zkp_engine import (
    BatchProcessor,
    ChallengeGenerator,
    KeyPair,
    SchnorrProver,
    SchnorrVerifier,
)
from zkp_engine.utils import bytes_to_point, point_to_bytes, timing_safe_compare


class TestKeyPair:
    """Tests for secp256k1 key pair generation."""

    def test_generate_creates_valid_keypair(self) -> None:
        kp = KeyPair.generate()
        assert kp.private_key > 0
        assert len(kp.public_key) == 2
        assert kp.public_key[0] > 0
        assert kp.public_key[1] > 0

    def test_generate_unique_keys(self) -> None:
        kp1 = KeyPair.generate()
        kp2 = KeyPair.generate()
        assert kp1.private_key != kp2.private_key

    def test_to_hex_round_trip(self) -> None:
        kp = KeyPair.generate()
        hex_data = kp.to_hex()
        restored = KeyPair.from_hex(hex_data["private_key"])
        assert kp.public_key == restored.public_key

    def test_to_dict(self) -> None:
        kp = KeyPair.generate()
        d = kp.to_dict()
        assert "private_key" in d
        assert "public_key_x" in d
        assert "public_key_y" in d


class TestSchnorrProof:
    """Tests for Schnorr proof creation and verification."""

    def test_create_and_verify_proof(self, key_pair: KeyPair) -> None:
        prover = SchnorrProver(private_key=key_pair.private_key)
        proof = prover.create_proof()

        verifier = SchnorrVerifier(public_key=key_pair.public_key)
        assert verifier.verify(proof) is True

    def test_proof_with_message(self, key_pair: KeyPair) -> None:
        message = b"authenticate:user123:1713180000"
        prover = SchnorrProver(private_key=key_pair.private_key)
        proof = prover.create_proof_with_message(message=message)

        verifier = SchnorrVerifier(public_key=key_pair.public_key)
        assert verifier.verify_with_message(proof, message) is True
        assert proof.message_hash is not None

    def test_proof_fails_with_wrong_message(self, key_pair: KeyPair) -> None:
        message = b"original_message"
        prover = SchnorrProver(private_key=key_pair.private_key)
        proof = prover.create_proof_with_message(message=message)

        verifier = SchnorrVerifier(public_key=key_pair.public_key)
        assert verifier.verify_with_message(proof, b"tampered_message") is False

    def test_proof_fails_with_wrong_key(self) -> None:
        kp1 = KeyPair.generate()
        kp2 = KeyPair.generate()

        prover = SchnorrProver(private_key=kp1.private_key)
        proof = prover.create_proof()

        verifier = SchnorrVerifier(public_key=kp2.public_key)
        assert verifier.verify(proof) is False

    def test_tampered_proof_fails(self, key_pair: KeyPair) -> None:
        prover = SchnorrProver(private_key=key_pair.private_key)
        proof = prover.create_proof()

        # Tamper with the response
        proof.response = (proof.response + 1) % (2**256)

        verifier = SchnorrVerifier(public_key=key_pair.public_key)
        assert verifier.verify(proof) is False

    def test_multiple_rounds(self, key_pair: KeyPair) -> None:
        """Each round produces a valid independent proof."""
        for _ in range(5):
            prover = SchnorrProver(private_key=key_pair.private_key)
            proof = prover.create_proof()
            verifier = SchnorrVerifier(public_key=key_pair.public_key)
            assert verifier.verify(proof) is True


class TestChallengeGenerator:
    """Tests for challenge generation."""

    def test_create_challenge(self) -> None:
        challenge = ChallengeGenerator.create_challenge(
            commitment=b"test_commitment",
            public_key=b"test_pubkey",
        )
        assert len(challenge.value) == 32  # SHA-256

    def test_create_challenge_with_context(self) -> None:
        c1 = ChallengeGenerator.create_challenge(b"c", b"p", context=b"ctx1")
        c2 = ChallengeGenerator.create_challenge(b"c", b"p", context=b"ctx2")
        assert c1.value != c2.value

    def test_auth_challenge(self) -> None:
        auth = ChallengeGenerator.create_auth_challenge(ttl_seconds=120)
        assert auth.challenge_id.startswith("ch_")
        assert len(auth.nonce) == 64  # 32 bytes hex

    def test_auth_challenge_ttl_clamped(self) -> None:
        auth = ChallengeGenerator.create_auth_challenge(ttl_seconds=9999)
        # Should be clamped to 300
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        max_expiry = now + timedelta(seconds=310)
        assert auth.expires_at < max_expiry


class TestBatchProcessor:
    """Tests for batch proof operations."""

    def test_batch_create(self) -> None:
        keys = [KeyPair.generate() for _ in range(5)]
        private_keys = [k.private_key for k in keys]
        messages = [None] * 5

        batch = BatchProcessor()
        proofs = batch.batch_create(private_keys, messages)
        assert len(proofs) == 5

    def test_batch_verify(self) -> None:
        keys = [KeyPair.generate() for _ in range(3)]
        provers = [SchnorrProver(k.private_key) for k in keys]
        proofs = [p.create_proof() for p in provers]
        public_keys = [k.public_key for k in keys]

        batch = BatchProcessor()
        results = batch.batch_verify(proofs, public_keys)
        assert len(results) == 3
        assert all(r.valid for r in results)

    def test_batch_mismatched_lengths(self) -> None:
        batch = BatchProcessor()
        with pytest.raises(ValueError, match="identical length"):
            batch.batch_create([1, 2], [None])


class TestUtils:
    """Tests for crypto utility functions."""

    def test_point_roundtrip(self) -> None:
        kp = KeyPair.generate()
        compressed = point_to_bytes(*kp.public_key)
        restored = bytes_to_point(compressed)
        assert restored == kp.public_key

    def test_timing_safe_compare(self) -> None:
        assert timing_safe_compare(b"hello", b"hello") is True
        assert timing_safe_compare(b"hello", b"world") is False
