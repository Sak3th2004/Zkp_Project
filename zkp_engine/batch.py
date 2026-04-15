from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
from typing import Sequence

from .models import Proof, VerificationResult
from .prover import SchnorrProver
from .utils import generate_proof_id
from .verifier import SchnorrVerifier


class BatchProcessor:
    def batch_create(
        self,
        private_keys: Sequence[int],
        messages: Sequence[bytes | None],
    ) -> list[Proof]:
        if len(private_keys) != len(messages):
            raise ValueError("private_keys and messages must have identical length")

        def _create(pair: tuple[int, bytes | None]) -> Proof:
            private_key, message = pair
            prover = SchnorrProver(private_key=private_key)
            return prover.create_proof_with_message(message=message)

        with ThreadPoolExecutor() as executor:
            return list(executor.map(_create, zip(private_keys, messages)))

    def batch_verify(
        self,
        proofs: Sequence[Proof],
        public_keys: Sequence[tuple[int, int]],
        messages: Sequence[bytes | None] | None = None,
    ) -> list[VerificationResult]:
        if len(proofs) != len(public_keys):
            raise ValueError("proofs and public_keys must have identical length")
        if messages is not None and len(messages) != len(proofs):
            raise ValueError("messages must match proofs length when provided")

        def _verify(args: tuple[int, Proof, tuple[int, int], bytes | None]) -> VerificationResult:
            idx, proof, public_key, message = args
            verifier = SchnorrVerifier(public_key=public_key)
            start = time.perf_counter()
            valid = verifier.verify_with_message(proof, message) if message else verifier.verify(proof)
            latency_ms = (time.perf_counter() - start) * 1000
            return VerificationResult(
                valid=valid,
                proof_id=generate_proof_id(),
                latency_ms=latency_ms,
                error=None if valid else f"verification_failed_at_index_{idx}",
            )

        data = (
            zip(range(len(proofs)), proofs, public_keys, messages)
            if messages is not None
            else zip(range(len(proofs)), proofs, public_keys, [None] * len(proofs))
        )
        with ThreadPoolExecutor() as executor:
            return list(executor.map(_verify, data))

