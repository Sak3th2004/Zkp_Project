"""ZKProofAPI Python SDK — Main client class."""

from __future__ import annotations

from typing import Any

import httpx

from .errors import AuthenticationError, RateLimitError, UsageLimitError, ZKProofAPIError


class ZKProofAPI:
    """Official Python client for the ZKProofAPI service.

    Args:
        api_key: Your API key (starts with ``sk_live_`` or ``sk_test_``).
        base_url: Override the default API base URL.
        timeout: Request timeout in seconds.
    """

    DEFAULT_BASE_URL = "https://api.zkproofapi.com"

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self._api_key = api_key
        self._client = httpx.Client(
            base_url=base_url or self.DEFAULT_BASE_URL,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": api_key,
            },
            timeout=timeout,
        )

    # ── Key Generation ──────────────────────────────────────────────

    def generate_key_pair(
        self,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate a new ZKP key pair on secp256k1.

        The private key is returned **once** and never stored on our servers.
        """
        return self._post("/v1/keys/generate", {"user_id": user_id, "metadata": metadata})

    # ── Proof Creation ──────────────────────────────────────────────

    def create_proof(
        self,
        private_key: str,
        public_key: str,
        message: str | None = None,
        rounds: int = 1,
    ) -> dict[str, Any]:
        """Create a zero-knowledge proof."""
        return self._post("/v1/proofs/create", {
            "private_key": private_key,
            "public_key": public_key,
            "message": message,
            "rounds": rounds,
        })

    # ── Proof Verification ──────────────────────────────────────────

    def verify_proof(
        self,
        proof: dict[str, Any],
        public_key: str,
        message: str | None = None,
    ) -> dict[str, Any]:
        """Verify a zero-knowledge proof."""
        return self._post("/v1/proofs/verify", {
            "proof": proof,
            "public_key": public_key,
            "message": message,
        })

    # ── Auth Challenge-Response ─────────────────────────────────────

    def create_challenge(
        self,
        public_key: str,
        session_id: str,
        ttl_seconds: int = 60,
    ) -> dict[str, Any]:
        """Start a ZKP authentication flow."""
        return self._post("/v1/auth/challenge", {
            "public_key": public_key,
            "session_id": session_id,
            "ttl_seconds": ttl_seconds,
        })

    def respond_to_challenge(
        self,
        challenge_id: str,
        proof: dict[str, Any],
    ) -> dict[str, Any]:
        """Complete ZKP authentication by submitting proof."""
        return self._post("/v1/auth/respond", {
            "challenge_id": challenge_id,
            "proof": proof,
        })

    # ── Usage ───────────────────────────────────────────────────────

    def get_usage(self) -> dict[str, Any]:
        """Get current usage metrics for your organization."""
        return self._get("/v1/usage")

    # ── Internal HTTP ───────────────────────────────────────────────

    def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        resp = self._client.post(path, json=body)
        return self._handle_response(resp)

    def _get(self, path: str) -> dict[str, Any]:
        resp = self._client.get(path)
        return self._handle_response(resp)

    def _handle_response(self, resp: httpx.Response) -> dict[str, Any]:
        if resp.is_success:
            return resp.json()

        data = resp.json()
        error = data.get("error", data)
        msg = error.get("message", "Unknown API error") if isinstance(error, dict) else str(error)
        err_type = error.get("type", "unknown") if isinstance(error, dict) else "unknown"

        if resp.status_code == 401:
            raise AuthenticationError(msg)
        if resp.status_code == 402:
            raise UsageLimitError(msg)
        if resp.status_code == 429:
            retry = error.get("retry_after", 60) if isinstance(error, dict) else 60
            raise RateLimitError(msg, retry)
        raise ZKProofAPIError(msg, err_type, resp.status_code)

    # ── Context Manager ─────────────────────────────────────────────

    def close(self) -> None:
        """Close the underlying HTTP connection."""
        self._client.close()

    def __enter__(self) -> "ZKProofAPI":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
