# ==============================================================================
# ZKProofAPI — Multi-stage Docker Build
# ==============================================================================

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Production ─────────────────────────────────────────────────────
FROM python:3.12-slim AS production

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY api/ ./api/
COPY zkp_engine/ ./zkp_engine/
COPY migrations/ ./migrations/
COPY pyproject.toml ./

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:8000/v1/health'); r.raise_for_status()" || exit 1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
