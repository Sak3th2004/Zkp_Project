/**
 * ZKProofAPI SDK — Type definitions
 */

export interface ZKProofAPIOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface GenerateKeyPairParams {
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface PublicKey {
  x: string;
  y: string;
  compressed: string;
}

export interface KeyPairResult {
  keyId: string;
  publicKey: PublicKey;
  privateKey: string;
  curve: string;
  createdAt: string;
  warning: string;
}

export interface CreateProofParams {
  privateKey: string;
  publicKey: string;
  message?: string;
  rounds?: number;
}

export interface Commitment {
  x: string;
  y: string;
}

export interface ProofData {
  commitment: Commitment;
  challenge: string;
  response: string;
  messageHash?: string | null;
}

export interface ProofResult {
  proofId: string;
  proof: ProofData;
  curve: string;
  rounds: number;
  createdAt: string;
  latencyMs: number;
}

export interface VerifyProofParams {
  proof: ProofData;
  publicKey: string;
  message?: string;
}

export interface VerifyResult {
  valid: boolean;
  proofId: string;
  verificationId: string;
  latencyMs: number;
  verifiedAt: string;
}

export interface CreateChallengeParams {
  publicKey: string;
  sessionId: string;
  ttlSeconds?: number;
}

export interface ChallengeResult {
  challengeId: string;
  challengeNonce: string;
  publicKey: string;
  expiresAt: string;
  ttlSeconds: number;
}

export interface RespondToChallengeParams {
  challengeId: string;
  proof: ProofData;
}

export interface AuthResult {
  authenticated: boolean;
  challengeId: string;
  sessionId: string;
  verifiedAt: string;
  latencyMs: number;
}

export interface UsageResult {
  orgId: string;
  plan: string;
  currentPeriod: string;
  usage: {
    proofCreates: { used: number; limit: number | null; remaining: number | null };
    proofVerifies: { used: number; limit: number | null; remaining: number | null };
    keyGenerates: { used: number; limit: number | null; remaining: number | null };
  };
  rateLimit: {
    requestsPerMinute: number;
    currentMinuteUsage: number;
  };
}

export interface APIError {
  type: string;
  message: string;
  retryAfter?: number;
  documentationUrl?: string;
}
