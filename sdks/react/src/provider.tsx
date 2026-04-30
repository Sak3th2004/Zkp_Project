/**
 * ZKProofProvider — React context for ZKProofAPI SDK
 *
 * Wraps your app and provides the API client to all child components
 * via useZKProof() hook.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type { ZKProofConfig, ZKPKeyPair, ZKPProof, ZKPVerificationResult, ZKPChallenge, ZKPAuthResult } from './types';

// ── HTTP Client ─────────────────────────────────────────────────

class ZKProofClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ZKProofConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.zkproofapi.com';
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error?.message || data?.detail || `Request failed (${res.status})`;
        throw new ZKProofError(msg, res.status, data?.error?.type);
      }

      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async generateKeyPair(opts?: { userId?: string }): Promise<ZKPKeyPair> {
    return this.request<ZKPKeyPair>('POST', '/v1/keys/generate', opts || {});
  }

  async createProof(opts: {
    privateKey: string;
    publicKey: string;
    message?: string;
    rounds?: number;
  }): Promise<ZKPProof> {
    return this.request<ZKPProof>('POST', '/v1/proofs/create', {
      private_key: opts.privateKey,
      public_key: opts.publicKey,
      message: opts.message,
      rounds: opts.rounds || 1,
    });
  }

  async verifyProof(opts: {
    proof: ZKPProof['proof'];
    publicKey: string;
    message?: string;
  }): Promise<ZKPVerificationResult> {
    return this.request<ZKPVerificationResult>('POST', '/v1/proofs/verify', {
      proof: opts.proof,
      public_key: opts.publicKey,
      message: opts.message,
    });
  }

  async createChallenge(opts: {
    publicKey: string;
    sessionId: string;
    ttlSeconds?: number;
  }): Promise<ZKPChallenge> {
    return this.request<ZKPChallenge>('POST', '/v1/auth/challenge', {
      public_key: opts.publicKey,
      session_id: opts.sessionId,
      ttl_seconds: opts.ttlSeconds || 60,
    });
  }

  async respondToChallenge(opts: {
    challengeId: string;
    proof: ZKPProof['proof'];
  }): Promise<ZKPAuthResult> {
    return this.request<ZKPAuthResult>('POST', '/v1/auth/respond', {
      challenge_id: opts.challengeId,
      proof: opts.proof,
    });
  }
}

// ── Error Class ─────────────────────────────────────────────────

export class ZKProofError extends Error {
  status: number;
  type?: string;

  constructor(message: string, status: number, type?: string) {
    super(message);
    this.name = 'ZKProofError';
    this.status = status;
    this.type = type;
  }
}

// ── React Context ───────────────────────────────────────────────

interface ZKProofContextValue {
  client: ZKProofClient;
  generateKeyPair: ZKProofClient['generateKeyPair'];
  createProof: ZKProofClient['createProof'];
  verifyProof: ZKProofClient['verifyProof'];
  createChallenge: ZKProofClient['createChallenge'];
  respondToChallenge: ZKProofClient['respondToChallenge'];
}

const ZKProofContext = createContext<ZKProofContextValue | null>(null);

interface ZKProofProviderProps {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  children: React.ReactNode;
}

export function ZKProofProvider({ apiKey, baseUrl, timeout, children }: ZKProofProviderProps) {
  const client = useMemo(
    () => new ZKProofClient({ apiKey, baseUrl, timeout }),
    [apiKey, baseUrl, timeout]
  );

  const value = useMemo<ZKProofContextValue>(
    () => ({
      client,
      generateKeyPair: client.generateKeyPair.bind(client),
      createProof: client.createProof.bind(client),
      verifyProof: client.verifyProof.bind(client),
      createChallenge: client.createChallenge.bind(client),
      respondToChallenge: client.respondToChallenge.bind(client),
    }),
    [client]
  );

  return React.createElement(ZKProofContext.Provider, { value }, children);
}

export function useZKProof(): ZKProofContextValue {
  const ctx = useContext(ZKProofContext);
  if (!ctx) {
    throw new Error('useZKProof must be used within a <ZKProofProvider>');
  }
  return ctx;
}
