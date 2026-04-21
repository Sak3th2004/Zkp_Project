"""Redis sliding-window rate limiter middleware."""

from __future__ import annotations

import time

import redis.asyncio as redis
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from api.config import settings

# Lazy-initialized Redis connection
_redis_client: redis.Redis | None = None


def _get_redis() -> redis.Redis:
    """Get or create Redis connection for rate limiting."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding window rate limiter using Redis.

    For each request carrying a resolved API key, we increment a counter
    in Redis keyed by ``rate:{identifier}:{minute_bucket}``.
    If the counter exceeds the configured limit, we return 429.

    Falls back to pass-through if Redis is unavailable (fail-open).
    """

    SKIP_PATHS = {"/v1/health", "/docs", "/openapi.json", "/redoc", "/v1/billing/webhook"}
    DEFAULT_LIMIT = 100  # requests per minute for unauthenticated

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip rate limiting for health checks, docs, and webhooks
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        # Determine identifier (API key prefix or IP)
        api_key_header = request.headers.get("X-API-Key", "")
        if api_key_header and "_" in api_key_header:
            identifier = api_key_header[:12]  # Use prefix as identifier
        else:
            identifier = request.client.host if request.client else "unknown"

        # Determine limit (org-specific limit would come from dependency layer)
        limit = self.DEFAULT_LIMIT
        current_minute = int(time.time()) // 60
        redis_key = f"rate:{identifier}:{current_minute}"

        try:
            r = _get_redis()
            pipe = r.pipeline()
            pipe.incr(redis_key)
            pipe.expire(redis_key, 120)  # TTL = 2 minutes (covers current + previous)
            results = await pipe.execute()
            current_count = results[0]
        except Exception:
            # Redis unavailable — fail open (allow request through)
            current_count = 0

        remaining = max(0, limit - current_count)
        reset_time = (current_minute + 1) * 60

        # Reject if over limit
        if current_count > limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "type": "rate_limit_exceeded",
                        "message": f"Rate limit of {limit} requests per minute exceeded",
                        "retry_after": reset_time - int(time.time()),
                    }
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                    "Retry-After": str(reset_time - int(time.time())),
                },
            )

        response = await call_next(request)

        # Attach rate-limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)

        return response
