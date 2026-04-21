# ZKProofAPI

> **Zero-Knowledge Proof Authentication as a Service**
>
> Add passwordless, privacy-preserving authentication to any application in 3 lines of code.

[![CI](https://github.com/Sak3th2004/Zkp_Project/actions/workflows/ci.yml/badge.svg)](https://github.com/Sak3th2004/Zkp_Project/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What is ZKProofAPI?

ZKProofAPI is a production-grade SaaS platform that provides zero-knowledge proof (ZKP) authentication infrastructure via a simple REST API. Built on Schnorr proofs over the secp256k1 elliptic curve, it enables:

- **Passwordless login** — users prove identity without revealing secrets
- **Privacy-preserving auth** — private keys never leave the client
- **Sub-5ms verification** — no blockchain, no smart contracts
- **3-line integration** — SDKs for JavaScript and Python

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ZKProofAPI                               │
├─────────────────┬───────────────────┬───────────────────────────┤
│   website/      │   dashboard/      │   api/                    │
│   Next.js 16    │   React + Vite    │   FastAPI                 │
│   Marketing     │   Dev Dashboard   │   REST API                │
│   SEO + Pricing │   11 pages        │   Auth + Proofs           │
├─────────────────┴───────────────────┼───────────────────────────┤
│                                     │   Services Layer          │
│   sdks/                             │   - Usage tracking        │
│   ├── javascript/  (@zkproofapi/sdk)│   - Audit logging         │
│   └── python/      (zkproofapi)     │   - API key management    │
│                                     │   - Celery tasks          │
├─────────────────────────────────────┼───────────────────────────┤
│   zkp_engine/                       │   Infrastructure          │
│   Schnorr proofs on secp256k1       │   PostgreSQL + Redis      │
│   Key generation, batch processing  │   Docker + CI/CD          │
└─────────────────────────────────────┴───────────────────────────┘
```

## Project Structure

```
├── api/                    # FastAPI backend
│   ├── config.py           # Pydantic settings
│   ├── main.py             # App factory
│   ├── dependencies.py     # API key auth
│   ├── dependencies_jwt.py # JWT auth for dashboard
│   ├── models/             # SQLAlchemy ORM (8 models)
│   ├── schemas/            # Pydantic request/response
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   ├── middleware/          # Request ID, rate limiter, logger
│   └── tasks/              # Celery (batch processing, webhooks)
├── zkp_engine/             # Cryptographic core
│   ├── keys.py             # secp256k1 key generation
│   ├── prover.py           # Schnorr proof creation
│   ├── verifier.py         # Proof verification
│   └── batch.py            # Batch processing
├── dashboard/              # React developer dashboard (Vite + TS)
│   └── src/pages/          # 11 pages (keys, analytics, logs, etc.)
├── website/                # Next.js marketing site
├── sdks/
│   ├── javascript/         # @zkproofapi/sdk (TypeScript, zero deps)
│   └── python/             # zkproofapi (httpx)
├── tests/                  # pytest (37 passing)
├── migrations/             # Alembic (async PostgreSQL)
├── .github/workflows/      # CI/CD pipeline
├── Dockerfile              # Multi-stage production build
└── docker-compose.yml      # Full stack (API + Postgres + Redis + Celery)
```

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/Sak3th2004/Zkp_Project.git
cd Zkp_Project
cp .env.example .env
pip install -r requirements.txt
```

### 2. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 3. Run API

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Run Dashboard

```bash
cd dashboard && npm install && npm run dev
```

### 5. Run Marketing Site

```bash
cd website && npm install && npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/keys/generate` | Generate secp256k1 key pair |
| `POST` | `/v1/proofs/create` | Create a Schnorr ZK proof |
| `POST` | `/v1/proofs/verify` | Verify a proof |
| `POST` | `/v1/proofs/batch` | Batch proof operations (async) |
| `POST` | `/v1/auth/challenge` | Create auth challenge |
| `POST` | `/v1/auth/respond` | Respond to challenge with proof |
| `GET`  | `/v1/usage` | Get usage metrics |
| `GET`  | `/v1/health` | Health check |

### Dashboard API (JWT-protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/dashboard/signup` | Create account + org |
| `POST` | `/dashboard/login` | Login, returns JWT |
| `GET`  | `/dashboard/me` | Current user info |
| `POST` | `/dashboard/keys` | Create API key |
| `GET`  | `/dashboard/keys` | List API keys |
| `DELETE` | `/dashboard/keys/{id}` | Revoke key |
| `POST` | `/dashboard/keys/{id}/rotate` | Rotate key |
| `POST` | `/dashboard/billing/checkout` | Stripe checkout |
| `GET`  | `/dashboard/billing/invoices` | Invoice history |

## SDK Usage

### JavaScript

```typescript
import { ZKProofAPI } from '@zkproofapi/sdk';

const zkp = new ZKProofAPI('sk_live_your_api_key');
const keys = await zkp.generateKeyPair({ userId: 'user_123' });
const proof = await zkp.createProof({ privateKey: keys.privateKey, publicKey: keys.publicKey.compressed });
const result = await zkp.verifyProof({ proof: proof.proof, publicKey: keys.publicKey.compressed });
console.log(result.valid); // true
```

### Python

```python
from zkproofapi import ZKProofAPI

zkp = ZKProofAPI(api_key="sk_live_your_api_key")
keys = zkp.generate_key_pair(user_id="user_123")
proof = zkp.create_proof(private_key=keys["private_key"], public_key=keys["public_key"]["compressed"])
result = zkp.verify_proof(proof=proof["proof"], public_key=keys["public_key"]["compressed"])
print(result["valid"])  # True
```

## Testing

```bash
python -m pytest tests/ -v   # 37 tests passing
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Crypto** | secp256k1, Schnorr proofs, HMAC-SHA256 |
| **API** | FastAPI, Pydantic, SQLAlchemy 2.0 (async) |
| **Auth** | bcrypt, JWT (PyJWT), API key prefix lookup |
| **Database** | PostgreSQL (asyncpg), Alembic migrations |
| **Cache** | Redis |
| **Tasks** | Celery (batch processing, webhook delivery) |
| **Dashboard** | React 18, TypeScript, Vite, Zustand, Recharts, Tailwind |
| **Website** | Next.js 16, Tailwind v4 |
| **SDKs** | TypeScript (zero deps), Python (httpx) |
| **CI/CD** | GitHub Actions |
| **Deploy** | Docker, docker-compose |

## License

MIT
