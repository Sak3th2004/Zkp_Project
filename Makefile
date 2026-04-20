# ZKProofAPI — Makefile shortcuts
# Usage: make <target>

.PHONY: dev test lint format migrate docker-up docker-down

# ── Development ─────────────────────────────────────────────────────
dev:
	uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# ── Testing ─────────────────────────────────────────────────────────
test:
	pytest --cov=api --cov=zkp_engine --cov-report=term-missing -v

test-unit:
	pytest tests/unit -v

test-integration:
	pytest tests/integration -v

# ── Linting ─────────────────────────────────────────────────────────
lint:
	ruff check .
	mypy api/ zkp_engine/

format:
	ruff format .

# ── Database ────────────────────────────────────────────────────────
migrate:
	alembic upgrade head

migrate-create:
	alembic revision --autogenerate -m "$(msg)"

# ── Docker ──────────────────────────────────────────────────────────
docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f api

# ── Full Stack ──────────────────────────────────────────────────────
setup:
	pip install -r requirements-dev.txt
	@echo "Setup complete. Run 'make dev' to start the API server."
