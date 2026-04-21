/**
 * ZKProofAPI — Official JavaScript/TypeScript SDK
 *
 * Zero-Knowledge Authentication. Three Lines of Code.
 *
 * @example
 * ```typescript
 * import { ZKProofAPI } from '@zkproofapi/sdk';
 *
 * const zkp = new ZKProofAPI('sk_live_your_api_key');
 * const keyPair = await zkp.generateKeyPair({ userId: 'user_123' });
 * const proof = await zkp.createProof({ privateKey: keyPair.privateKey, publicKey: keyPair.publicKey.compressed });
 * const result = await zkp.verifyProof({ proof: proof.proof, publicKey: keyPair.publicKey.compressed });
 * console.log(result.valid); // true
 * ```
 */

import { HttpClient } from './client';
import type {
  ZKProofAPIOptions,
  GenerateKeyPairParams,
  KeyPairResult,
  CreateProofParams,
  ProofResult,
  VerifyProofParams,
  VerifyResult,
  CreateChallengeParams,
  ChallengeResult,
  RespondToChallengeParams,
  AuthResult,
  UsageResult,
} from './types';

export class ZKProofAPI {
  private client: HttpClient;

  constructor(apiKeyOrOptions: string | ZKProofAPIOptions) {
    const opts = typeof apiKeyOrOptions === 'string'
      ? { apiKey: apiKeyOrOptions }
      : apiKeyOrOptions;

    this.client = new HttpClient(
      opts.apiKey,
      opts.baseUrl || 'https://api.zkproofapi.com',
      opts.timeout || 30000,
    );
  }

  /** Generate a new ZKP key pair on secp256k1. Private key is returned ONCE. */
  async generateKeyPair(params: GenerateKeyPairParams = {}): Promise<KeyPairResult> {
    return this.client.request<KeyPairResult>({
      method: 'POST',
      path: '/v1/keys/generate',
      body: { user_id: params.userId, metadata: params.metadata },
    });
  }

  /** Create a zero-knowledge proof. */
  async createProof(params: CreateProofParams): Promise<ProofResult> {
    return this.client.request<ProofResult>({
      method: 'POST',
      path: '/v1/proofs/create',
      body: {
        private_key: params.privateKey,
        public_key: params.publicKey,
        message: params.message,
        rounds: params.rounds || 1,
      },
    });
  }

  /** Verify a zero-knowledge proof. */
  async verifyProof(params: VerifyProofParams): Promise<VerifyResult> {
    return this.client.request<VerifyResult>({
      method: 'POST',
      path: '/v1/proofs/verify',
      body: {
        proof: params.proof,
        public_key: params.publicKey,
        message: params.message,
      },
    });
  }

  /** Start a ZKP authentication flow by creating a challenge. */
  async createChallenge(params: CreateChallengeParams): Promise<ChallengeResult> {
    return this.client.request<ChallengeResult>({
      method: 'POST',
      path: '/v1/auth/challenge',
      body: {
        public_key: params.publicKey,
        session_id: params.sessionId,
        ttl_seconds: params.ttlSeconds || 60,
      },
    });
  }

  /** Complete ZKP authentication by submitting proof. */
  async respondToChallenge(params: RespondToChallengeParams): Promise<AuthResult> {
    return this.client.request<AuthResult>({
      method: 'POST',
      path: '/v1/auth/respond',
      body: {
        challenge_id: params.challengeId,
        proof: params.proof,
      },
    });
  }

  /** Get current usage metrics. */
  async getUsage(): Promise<UsageResult> {
    return this.client.request<UsageResult>({
      method: 'GET',
      path: '/v1/usage',
    });
  }
}

// Re-export everything
export { ZKProofAPIError, RateLimitError, AuthenticationError, UsageLimitError } from './errors';
export type * from './types';
