"""
ZKProofAPI — Official Python SDK

Zero-Knowledge Authentication. Three Lines of Code.

Example::

    from zkproofapi import ZKProofAPI

    zkp = ZKProofAPI(api_key="sk_live_your_api_key")
    key_pair = zkp.generate_key_pair(user_id="user_123")
    proof = zkp.create_proof(
        private_key=key_pair["private_key"],
        public_key=key_pair["public_key"]["compressed"],
    )
    result = zkp.verify_proof(
        proof=proof["proof"],
        public_key=key_pair["public_key"]["compressed"],
    )
    print(result["valid"])  # True
"""

from .client import ZKProofAPI
from .errors import (
    ZKProofAPIError,
    AuthenticationError,
    RateLimitError,
    UsageLimitError,
)

__all__ = [
    "ZKProofAPI",
    "ZKProofAPIError",
    "AuthenticationError",
    "RateLimitError",
    "UsageLimitError",
]
__version__ = "1.0.0"
