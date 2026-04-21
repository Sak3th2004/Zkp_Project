/**
 * Dashboard API service — real API calls to backend
 */
import api from './client';

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data: { full_name: string; email: string; password: string; organization_name: string }) =>
    api.post('/dashboard/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/dashboard/login', data),
  me: () => api.get('/dashboard/me'),
};

// ── API Keys ─────────────────────────────────────────────────────
export const keysAPI = {
  list: () => api.get('/dashboard/keys'),
  create: (data: { name: string; key_type: string }) =>
    api.post('/dashboard/keys', data),
  revoke: (keyId: string) => api.delete(`/dashboard/keys/${keyId}`),
  rotate: (keyId: string) => api.post(`/dashboard/keys/${keyId}/rotate`),
};

// ── Usage / Analytics ────────────────────────────────────────────
export const usageAPI = {
  getCurrent: () => api.get('/v1/usage'),
};

// ── Billing ──────────────────────────────────────────────────────
export const billingAPI = {
  createCheckout: () => api.post('/dashboard/billing/checkout'),
  listInvoices: () => api.get('/dashboard/billing/invoices'),
};

// ── ZKP Operations (for playground) ──────────────────────────────
export const zkpAPI = {
  generateKeys: (data?: { user_id?: string }) =>
    api.post('/v1/keys/generate', data || {}),
  createProof: (data: { private_key: string; public_key: string; message?: string; rounds?: number }) =>
    api.post('/v1/proofs/create', data),
  verifyProof: (data: { proof: any; public_key: string; message?: string }) =>
    api.post('/v1/proofs/verify', data),
  createChallenge: (data: { public_key: string; session_id: string; ttl_seconds?: number }) =>
    api.post('/v1/auth/challenge', data),
  healthCheck: () => api.get('/v1/health'),
};
