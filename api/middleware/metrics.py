"""Prometheus metrics endpoint and middleware for API observability."""

from __future__ import annotations

import time

from fastapi import APIRouter, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response as StarletteResponse

# Simple in-process metrics (no prometheus_client dependency needed)
_metrics: dict[str, float] = {
    "http_requests_total": 0,
    "http_requests_errors_total": 0,
    "http_request_duration_seconds_sum": 0,
    "proofs_created_total": 0,
    "proofs_verified_total": 0,
    "keys_generated_total": 0,
}

_latency_buckets: dict[str, int] = {
    "le_005": 0,   # <= 5ms
    "le_010": 0,   # <= 10ms
    "le_050": 0,   # <= 50ms
    "le_100": 0,   # <= 100ms
    "le_500": 0,   # <= 500ms
    "le_inf": 0,   # > 500ms
}

_status_counts: dict[str, int] = {}


def increment_metric(name: str, value: float = 1) -> None:
    """Thread-safe metric increment (GIL protects simple operations)."""
    if name in _metrics:
        _metrics[name] += value


class MetricsMiddleware(BaseHTTPMiddleware):
    """Collect request count, error rate, and latency distribution."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> StarletteResponse:
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start

        _metrics["http_requests_total"] += 1
        _metrics["http_request_duration_seconds_sum"] += duration

        status = str(response.status_code)
        _status_counts[status] = _status_counts.get(status, 0) + 1

        if response.status_code >= 400:
            _metrics["http_requests_errors_total"] += 1

        # Latency histogram buckets
        duration_ms = duration * 1000
        if duration_ms <= 5:
            _latency_buckets["le_005"] += 1
        elif duration_ms <= 10:
            _latency_buckets["le_010"] += 1
        elif duration_ms <= 50:
            _latency_buckets["le_050"] += 1
        elif duration_ms <= 100:
            _latency_buckets["le_100"] += 1
        elif duration_ms <= 500:
            _latency_buckets["le_500"] += 1
        else:
            _latency_buckets["le_inf"] += 1

        # Track operation-specific metrics
        path = request.url.path
        if response.status_code < 400:
            if path == "/v1/proofs/create":
                _metrics["proofs_created_total"] += 1
            elif path == "/v1/proofs/verify":
                _metrics["proofs_verified_total"] += 1
            elif path == "/v1/keys/generate":
                _metrics["keys_generated_total"] += 1

        return response


# ── Metrics Endpoint ──────────────────────────────────────────────

router = APIRouter(tags=["Monitoring"])


@router.get("/metrics")
async def prometheus_metrics() -> Response:
    """Expose metrics in Prometheus text format."""
    lines = []

    # Counters
    lines.append("# HELP http_requests_total Total HTTP requests")
    lines.append("# TYPE http_requests_total counter")
    lines.append(f'http_requests_total {int(_metrics["http_requests_total"])}')

    lines.append("# HELP http_requests_errors_total Total HTTP error responses (4xx + 5xx)")
    lines.append("# TYPE http_requests_errors_total counter")
    lines.append(f'http_requests_errors_total {int(_metrics["http_requests_errors_total"])}')

    # Status code breakdown
    lines.append("# HELP http_responses_by_status HTTP responses by status code")
    lines.append("# TYPE http_responses_by_status counter")
    for status, count in sorted(_status_counts.items()):
        lines.append(f'http_responses_by_status{{status="{status}"}} {count}')

    # Duration
    lines.append("# HELP http_request_duration_seconds_sum Total request processing time")
    lines.append("# TYPE http_request_duration_seconds_sum counter")
    lines.append(f'http_request_duration_seconds_sum {_metrics["http_request_duration_seconds_sum"]:.4f}')

    # Latency histogram
    lines.append("# HELP http_request_duration_ms_bucket Request latency distribution")
    lines.append("# TYPE http_request_duration_ms_bucket counter")
    for bucket, count in _latency_buckets.items():
        label = bucket.replace("le_", "").replace("inf", "+Inf")
        if label != "+Inf":
            label = str(int(label))
        lines.append(f'http_request_duration_ms_bucket{{le="{label}"}} {count}')

    # Business metrics
    lines.append("# HELP proofs_created_total Total proofs created")
    lines.append("# TYPE proofs_created_total counter")
    lines.append(f'proofs_created_total {int(_metrics["proofs_created_total"])}')

    lines.append("# HELP proofs_verified_total Total proofs verified")
    lines.append("# TYPE proofs_verified_total counter")
    lines.append(f'proofs_verified_total {int(_metrics["proofs_verified_total"])}')

    lines.append("# HELP keys_generated_total Total keys generated")
    lines.append("# TYPE keys_generated_total counter")
    lines.append(f'keys_generated_total {int(_metrics["keys_generated_total"])}')

    body = "\n".join(lines) + "\n"
    return Response(content=body, media_type="text/plain; version=0.0.4; charset=utf-8")
