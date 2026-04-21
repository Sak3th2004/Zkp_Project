/**
 * ZKProofAPI SDK — HTTP client wrapper (native fetch, zero dependencies)
 */

import { ZKProofAPIError, RateLimitError, AuthenticationError, UsageLimitError } from './errors';

interface RequestOptions {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}

export class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(apiKey: string, baseUrl: string, timeout: number) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${opts.path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      };

      const fetchOpts: RequestInit = {
        method: opts.method,
        headers,
        signal: controller.signal,
      };

      if (opts.body && opts.method !== 'GET') {
        fetchOpts.body = JSON.stringify(opts.body);
      }

      const response = await fetch(url, fetchOpts);
      const data = await response.json();

      if (!response.ok) {
        this.handleError(response.status, data);
      }

      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private handleError(status: number, data: any): never {
    const error = data?.error || data;
    const message = error?.message || 'Unknown API error';
    const type = error?.type || 'unknown_error';

    switch (status) {
      case 401:
        throw new AuthenticationError(message);
      case 402:
        throw new UsageLimitError(message);
      case 429:
        throw new RateLimitError(message, error?.retry_after || 60);
      default:
        throw new ZKProofAPIError(message, type, status, error?.documentation_url);
    }
  }
}
