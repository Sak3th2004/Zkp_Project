# @zkproofapi/sdk

Official JavaScript/TypeScript SDK for **ZKProofAPI** — Zero-Knowledge Proof Authentication as a Service.

## Installation

```bash
npm install @zkproofapi/sdk
```

## Quick Start

```typescript
import { ZKProofAPI } from '@zkproofapi/sdk';

const zkp = new ZKProofAPI('sk_live_your_api_key');

// 1. Generate a key pair (private key returned ONCE)
const keys = await zkp.generateKeyPair({ userId: 'user_123' });

// 2. Create a zero-knowledge proof
const proof = await zkp.createProof({
  privateKey: keys.privateKey,
  publicKey: keys.publicKey.compressed,
  message: 'login:user_123',
});

// 3. Verify the proof
const result = await zkp.verifyProof({
  proof: proof.proof,
  publicKey: keys.publicKey.compressed,
  message: 'login:user_123',
});

console.log(result.valid); // true
```

## Auth Challenge-Response Flow

```typescript
// Server creates a challenge
const challenge = await zkp.createChallenge({
  publicKey: userPublicKey,
  sessionId: 'session_abc',
  ttlSeconds: 60,
});

// Client responds with a proof
const auth = await zkp.respondToChallenge({
  challengeId: challenge.challengeId,
  proof: clientProof,
});

console.log(auth.authenticated); // true
```

## Error Handling

```typescript
import { ZKProofAPI, RateLimitError, AuthenticationError } from '@zkproofapi/sdk';

try {
  const result = await zkp.verifyProof(params);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  }
}
```

## Configuration

```typescript
const zkp = new ZKProofAPI({
  apiKey: 'sk_live_your_api_key',
  baseUrl: 'https://api.zkproofapi.com', // default
  timeout: 30000, // 30s default
});
```

## License

MIT
