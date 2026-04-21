/**
 * ZKProofAPI SDK — Custom error classes
 */

import type { APIError } from './types';

export class ZKProofAPIError extends Error {
  public readonly type: string;
  public readonly statusCode: number;
  public readonly documentationUrl?: string;

  constructor(message: string, type: string, statusCode: number, docUrl?: string) {
    super(message);
    this.name = 'ZKProofAPIError';
    this.type = type;
    this.statusCode = statusCode;
    this.documentationUrl = docUrl;
  }
}

export class RateLimitError extends ZKProofAPIError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 'rate_limit_exceeded', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends ZKProofAPIError {
  constructor(message: string) {
    super(message, 'invalid_api_key', 401);
    this.name = 'AuthenticationError';
  }
}

export class UsageLimitError extends ZKProofAPIError {
  constructor(message: string) {
    super(message, 'usage_limit_exceeded', 402);
    this.name = 'UsageLimitError';
  }
}
