"""Custom exception classes for ZKProofAPI SDK."""

from __future__ import annotations


class ZKProofAPIError(Exception):
    """Base exception for all API errors."""

    def __init__(self, message: str, error_type: str, status_code: int, doc_url: str | None = None):
        super().__init__(message)
        self.error_type = error_type
        self.status_code = status_code
        self.documentation_url = doc_url


class AuthenticationError(ZKProofAPIError):
    """Raised on 401 — invalid or missing API key."""

    def __init__(self, message: str = "Invalid API key"):
        super().__init__(message, "invalid_api_key", 401)


class RateLimitError(ZKProofAPIError):
    """Raised on 429 — too many requests."""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 60):
        super().__init__(message, "rate_limit_exceeded", 429)
        self.retry_after = retry_after


class UsageLimitError(ZKProofAPIError):
    """Raised on 402 — monthly usage quota exhausted."""

    def __init__(self, message: str = "Usage limit exceeded"):
        super().__init__(message, "usage_limit_exceeded", 402)
