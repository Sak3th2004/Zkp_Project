# ZKProofAPI

> **Zero-Knowledge Authentication. Three Lines of Code.**

A production-ready, multi-tenant SaaS platform that lets any website/app add zero-knowledge proof authentication via a simple REST API + SDK integration.

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Marketing   │     │  Developer   │     │   Client SDKs    │
│   Website    │     │  Dashboard   │     │  (JS/Python)     │
│  (Next.js)   │     │  (React+TS)  │     │                  │
└──────┬───────┘     └──────┬───────┘     └────────┬─────────┘
       │                    │                      │
       └────────────────────┼──────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   FastAPI      │
                    │   REST API     │
                    │   /v1/*        │
                    └───────┬────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
       ┌──────▼──────┐ ┌───▼────┐  ┌──────▼──────┐
       │ PostgreSQL  │ │ Redis  │  │  Celery     │
       │   (Data)    │ │(Cache) │  │  (Queue)    │
       └─────────────┘ └────────┘  └─────────────┘
```

## 🔐 Core: ZKP Cryptographic Engine

The `zkp_engine/` package implements Schnorr zero-knowledge proofs on the secp256k1 elliptic curve:

- **Key Generation** — Secure keypair generation using `secrets.randbelow()`
- **Proof Creation** — Non-interactive Schnorr proofs with optional message binding
- **Proof Verification** — Constant-time verification: `s*G + e*P == R`
- **Batch Processing** — Parallel proof generation/verification
- **Challenge-Response** — Interactive authentication protocol

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **API** | Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| **Database** | PostgreSQL 16 (asyncpg) |
| **Cache/Queue** | Redis 7, Celery |
| **Dashboard** | React 18, TypeScript, Tailwind CSS 3, Vite |
| **Website** | Next.js 14 (App Router) |
| **SDKs** | TypeScript (npm), Python (PyPI) |
| **DevOps** | Docker, GitHub Actions, Railway/Render |

## 📁 Project Structure

```
zkproofapi/
├── api/                    # FastAPI backend
│   ├── routes/             # API endpoints (/v1/*)
│   ├── middleware/          # Auth, rate limiting, logging
│   ├── models/             # SQLAlchemy ORM models
│   ├── schemas/            # Pydantic request/response schemas
│   ├── services/           # Business logic layer
│   └── tasks/              # Celery async tasks
├── zkp_engine/             # Standalone crypto engine
├── dashboard/              # React developer dashboard
├── website/                # Next.js marketing site
├── sdks/                   # JavaScript & Python SDKs
├── tests/                  # Unit, integration, load tests
├── migrations/             # Alembic database migrations
└── monitoring/             # Prometheus + Grafana configs
```

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/Sak3th2004/Zkp_Project.git
cd Zkp_Project

# Start with Docker
docker compose up --build

# API: http://localhost:8000
# Dashboard: http://localhost:3000
# Docs: http://localhost:8000/docs
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/keys/generate` | Generate a new ZKP keypair |
| `POST` | `/v1/proofs/create` | Create a zero-knowledge proof |
| `POST` | `/v1/proofs/verify` | Verify a proof |
| `POST` | `/v1/proofs/batch` | Batch create/verify (async) |
| `POST` | `/v1/auth/challenge` | Start ZKP auth flow |
| `POST` | `/v1/auth/respond` | Complete ZKP auth |
| `GET`  | `/v1/usage` | Current usage metrics |
| `GET`  | `/v1/health` | Health check |

## 💰 Pricing Plans

| Feature | Free | Pro ($29/mo) | Enterprise |
|---------|------|-------------|------------|
| Proofs/month | 1,000 | 50,000 | Unlimited |
| Verifications/month | 5,000 | 250,000 | Unlimited |
| API Keys | 2 | 10 | Unlimited |
| Batch Operations | — | ✅ | ✅ |
| Webhooks | — | ✅ | ✅ |
| Rate Limit | 100/min | 1,000/min | 10,000/min |

## 📝 License

MIT
