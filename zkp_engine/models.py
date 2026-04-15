from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(slots=True)
class Challenge:
    value: bytes


@dataclass(slots=True)
class Proof:
    commitment_x: int
    commitment_y: int
    challenge: int
    response: int
    message_hash: str | None = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict[str, int | str | None]:
        return {
            "commitment_x": self.commitment_x,
            "commitment_y": self.commitment_y,
            "challenge": self.challenge,
            "response": self.response,
            "message_hash": self.message_hash,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass(slots=True)
class KeyPair:
    private_key: int
    public_key_x: int
    public_key_y: int


@dataclass(slots=True)
class AuthChallenge:
    nonce: str
    expires_at: datetime
    challenge_id: str


@dataclass(slots=True)
class VerificationResult:
    valid: bool
    proof_id: str
    latency_ms: float
    error: str | None = None

