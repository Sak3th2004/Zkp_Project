/**
 * useZKPAuth — High-level authentication hook
 *
 * Manages the full ZKP auth lifecycle:
 * 1. Key storage (localStorage)
 * 2. Challenge-response flow
 * 3. Auth state management
 *
 * Usage:
 *   const { authenticate, register, isAuthenticated, isLoading } = useZKPAuth();
 */

import { useState, useCallback, useEffect } from 'react';
import { useZKProof } from './provider';
import type { ZKPAuthState } from './types';

const STORAGE_PREFIX = 'zkp_auth_';

interface UseZKPAuthOptions {
  /** Storage key prefix for this app */
  storagePrefix?: string;
  /** Auto-check if user has stored keys on mount */
  autoDetect?: boolean;
}

export function useZKPAuth(options: UseZKPAuthOptions = {}) {
  const { storagePrefix = STORAGE_PREFIX, autoDetect = true } = options;
  const { generateKeyPair, createProof, verifyProof, createChallenge, respondToChallenge } = useZKProof();

  const [state, setState] = useState<ZKPAuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    publicKey: null,
  });

  // Check for existing keys on mount
  useEffect(() => {
    if (autoDetect) {
      const pk = localStorage.getItem(`${storagePrefix}public_key`);
      if (pk) {
        setState((s) => ({ ...s, publicKey: pk }));
      }
    }
  }, [autoDetect, storagePrefix]);

  /**
   * Register a new user — generates ZKP key pair and stores it
   */
  const register = useCallback(
    async (userId?: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const keys = await generateKeyPair(userId ? { userId } : undefined);

        // Store keys securely in localStorage
        localStorage.setItem(`${storagePrefix}private_key`, keys.privateKey);
        localStorage.setItem(`${storagePrefix}public_key`, keys.publicKey.compressed);
        localStorage.setItem(`${storagePrefix}key_id`, keys.keyId);

        setState({
          isAuthenticated: false,
          isLoading: false,
          error: null,
          publicKey: keys.publicKey.compressed,
        });

        return keys;
      } catch (err: any) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: err.message || 'Registration failed',
        }));
        throw err;
      }
    },
    [generateKeyPair, storagePrefix]
  );

  /**
   * Authenticate — creates a ZKP proof using stored private key
   * and verifies it against the public key
   */
  const authenticate = useCallback(
    async (opts?: { sessionId?: string; message?: string }) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const privateKey = localStorage.getItem(`${storagePrefix}private_key`);
        const publicKey = localStorage.getItem(`${storagePrefix}public_key`);

        if (!privateKey || !publicKey) {
          throw new Error('No stored keys found. Call register() first.');
        }

        // Create proof
        const message = opts?.message || `auth:${Date.now()}`;
        const proofResult = await createProof({
          privateKey,
          publicKey,
          message,
        });

        // Verify proof
        const verification = await verifyProof({
          proof: proofResult.proof,
          publicKey,
          message,
        });

        setState({
          isAuthenticated: verification.valid,
          isLoading: false,
          error: verification.valid ? null : 'Proof verification failed',
          publicKey,
        });

        return {
          authenticated: verification.valid,
          proofId: proofResult.proofId,
          verificationId: verification.verificationId,
          latencyMs: verification.latencyMs,
        };
      } catch (err: any) {
        setState((s) => ({
          ...s,
          isAuthenticated: false,
          isLoading: false,
          error: err.message || 'Authentication failed',
        }));
        throw err;
      }
    },
    [createProof, verifyProof, storagePrefix]
  );

  /**
   * Challenge-response authentication (server-side verified)
   */
  const challengeAuth = useCallback(
    async (sessionId: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const privateKey = localStorage.getItem(`${storagePrefix}private_key`);
        const publicKey = localStorage.getItem(`${storagePrefix}public_key`);

        if (!privateKey || !publicKey) {
          throw new Error('No stored keys found. Call register() first.');
        }

        // Request challenge from server
        const challenge = await createChallenge({
          publicKey,
          sessionId,
          ttlSeconds: 60,
        });

        // Create proof using challenge nonce
        const proofResult = await createProof({
          privateKey,
          publicKey,
          message: challenge.challengeNonce,
        });

        // Submit proof response
        const authResult = await respondToChallenge({
          challengeId: challenge.challengeId,
          proof: proofResult.proof,
        });

        setState({
          isAuthenticated: authResult.authenticated,
          isLoading: false,
          error: authResult.authenticated ? null : 'Challenge-response failed',
          publicKey,
        });

        return authResult;
      } catch (err: any) {
        setState((s) => ({
          ...s,
          isAuthenticated: false,
          isLoading: false,
          error: err.message || 'Challenge auth failed',
        }));
        throw err;
      }
    },
    [createChallenge, createProof, respondToChallenge, storagePrefix]
  );

  /**
   * Logout — clear stored keys and auth state
   */
  const logout = useCallback(() => {
    localStorage.removeItem(`${storagePrefix}private_key`);
    localStorage.removeItem(`${storagePrefix}public_key`);
    localStorage.removeItem(`${storagePrefix}key_id`);
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      publicKey: null,
    });
  }, [storagePrefix]);

  /**
   * Check if user has stored keys (can attempt auth)
   */
  const hasKeys = !!localStorage.getItem(`${storagePrefix}private_key`);

  return {
    ...state,
    register,
    authenticate,
    challengeAuth,
    logout,
    hasKeys,
  };
}
