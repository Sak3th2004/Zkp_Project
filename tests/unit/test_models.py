"""Unit tests for Pydantic schema validation."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from api.schemas.keys import KeyGenerateRequest
from api.schemas.proofs import ProofCreateRequest, ProofVerifyRequest, CommitmentSchema, ProofDataSchema
from api.schemas.auth import AuthChallengeRequest
from api.schemas.errors import ErrorResponse, ErrorDetail


class TestKeySchemas:
    def test_key_generate_minimal(self) -> None:
        req = KeyGenerateRequest()
        assert req.user_id is None
        assert req.metadata is None

    def test_key_generate_with_data(self) -> None:
        req = KeyGenerateRequest(user_id="user_123", metadata={"role": "admin"})
        assert req.user_id == "user_123"


class TestProofSchemas:
    def test_proof_create_defaults(self) -> None:
        req = ProofCreateRequest(
            private_key="abcdef1234567890",
            public_key="02abcdef",
        )
        assert req.rounds == 1
        assert req.message is None

    def test_proof_create_rounds_validation(self) -> None:
        with pytest.raises(ValidationError):
            ProofCreateRequest(
                private_key="abc",
                public_key="02abc",
                rounds=10,  # max is 5
            )

    def test_proof_verify_request(self) -> None:
        req = ProofVerifyRequest(
            proof=ProofDataSchema(
                commitment=CommitmentSchema(x="abc", y="def"),
                challenge="123",
                response="456",
            ),
            public_key="02abcdef",
        )
        assert req.proof.commitment.x == "abc"


class TestAuthSchemas:
    def test_challenge_request_defaults(self) -> None:
        req = AuthChallengeRequest(
            public_key="02abc",
            session_id="sess_123",
        )
        assert req.ttl_seconds == 60

    def test_challenge_ttl_validation(self) -> None:
        with pytest.raises(ValidationError):
            AuthChallengeRequest(
                public_key="02abc",
                session_id="sess_123",
                ttl_seconds=999,  # max is 300
            )


class TestErrorSchemas:
    def test_error_response(self) -> None:
        resp = ErrorResponse(
            error=ErrorDetail(
                type="rate_limit_exceeded",
                message="Too many requests",
                retry_after=23,
            ),
            request_id="req_abc123",
        )
        assert resp.error.type == "rate_limit_exceeded"
        assert resp.error.retry_after == 23
