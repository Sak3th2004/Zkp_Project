"""Redis sliding-window rate limiter middleware."""

from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding window rate limiter using Redis.

    For each request carrying a resolved API key (set by the dependency layer),
    we increment a counter in Redis keyed by ``rate:{api_key_id}:{minute_bucket}``.
    If the counter exceeds the org or key-level limit, we return 429.

    Until Redis is wired up, this middleware is a pass-through that sets headers
    with placeholder values so the rest of the stack stays consistent.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip rate limiting for health checks and docs
        if request.url.path in ("/v1/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        response = await call_next(request)

        # Attach rate-limit headers (placeholder until Redis integration)
        response.headers["X-RateLimit-Limit"] = "100"
        response.headers["X-RateLimit-Remaining"] = "99"
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)

        return response
