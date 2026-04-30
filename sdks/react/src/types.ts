/** Type definitions for @zkproofapi/react */

export interface ZKProofConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ZKPKeyPair {
  keyId: string;
  publicKey: {
    x: string;
    y: string;
    compressed: string;
  };
  privateKey: string;
  curve: string;
}

export interface ZKPProof {
  proofId: string;
  proof: {
    commitment: { x: string; y: string };
    challenge: string;
    response: string;
    message_hash?: string;
  };
  curve: string;
  rounds: number;
  latencyMs: number;
}

export interface ZKPVerificationResult {
  valid: boolean;
  proofId: string;
  verificationId: string;
  latencyMs: number;
}

export interface ZKPChallenge {
  challengeId: string;
  challengeNonce: string;
  publicKey: string;
  expiresAt: string;
  ttlSeconds: number;
}

export interface ZKPAuthResult {
  authenticated: boolean;
  challengeId: string;
  sessionId: string;
  latencyMs: number;
}

export interface ZKPAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  publicKey: string | null;
}
