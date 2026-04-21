# zkproofapi

Official Python SDK for **ZKProofAPI** — Zero-Knowledge Proof Authentication as a Service.

## Installation

```bash
pip install zkproofapi
```

## Quick Start

```python
from zkproofapi import ZKProofAPI

zkp = ZKProofAPI(api_key="sk_live_your_api_key")

# 1. Generate a key pair (private key returned ONCE)
key_pair = zkp.generate_key_pair(user_id="user_123")

# 2. Create a zero-knowledge proof
proof = zkp.create_proof(
    private_key=key_pair["private_key"],
    public_key=key_pair["public_key"]["compressed"],
    message="login:user_123",
)

# 3. Verify the proof
result = zkp.verify_proof(
    proof=proof["proof"],
    public_key=key_pair["public_key"]["compressed"],
    message="login:user_123",
)

print(result["valid"])  # True
```

## Auth Challenge-Response Flow

```python
# Server creates a challenge
challenge = zkp.create_challenge(
    public_key=user_public_key,
    session_id="session_abc",
    ttl_seconds=60,
)

# Client responds with a proof
auth = zkp.respond_to_challenge(
    challenge_id=challenge["challenge_id"],
    proof=client_proof,
)

print(auth["authenticated"])  # True
```

## Error Handling

```python
from zkproofapi import ZKProofAPI, RateLimitError, AuthenticationError

try:
    result = zkp.verify_proof(params)
except RateLimitError as e:
    print(f"Retry after {e.retry_after} seconds")
except AuthenticationError:
    print("Invalid API key")
```

## Context Manager

```python
with ZKProofAPI(api_key="sk_live_your_api_key") as zkp:
    keys = zkp.generate_key_pair()
    # connection auto-closed on exit
```

## License

MIT
