"""FastAPI application exposing legacy demo endpoints and new ZKProofAPI v1 routes."""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
from typing import Annotated, Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from src.backend import database, models, simulations, v1_schemas
from src.core import schnorr_zkp as zkp
from src.monitoring import logger, metrics
from zkp_engine import KeyPair, Proof, SchnorrProver, SchnorrVerifier
from zkp_engine.challenge import ChallengeGenerator
from zkp_engine.utils import (
    bytes_to_point,
    generate_proof_id,
    point_to_bytes,
)

_AUTH_CHALLENGES: dict[str, dict[str, Any]] = {}


class ApiError(HTTPException):
    def __init__(self, status_code: int, error_type: str, message: str, retry_after: int | None = None):
        super().__init__(status_code=status_code, detail=message)
        self.error_type = error_type
        self.api_message = message
        self.retry_after = retry_after


@asynccontextmanager
async def lifespan(_: FastAPI):
    await database.init_db()
    yield


app = FastAPI(title="ZKProofAPI", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DbConn = Annotated[Any, Depends(database.get_db)]


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = f"req_{uuid4().hex[:16]}"
    request.state.request_id = request_id
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
    return response


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    body: dict[str, Any] = {
        "error": {
            "type": exc.error_type,
            "message": exc.api_message,
            "documentation_url": f"https://docs.zkproofapi.com/errors/{exc.error_type.replace('_', '-')}",
        },
        "request_id": getattr(request.state, "request_id", None),
    }
    if exc.retry_after is not None:
        body["error"]["retry_after"] = exc.retry_after
    return Response(
        content=json.dumps(body),
        media_type="application/json",
        status_code=exc.status_code,
    )


def _require_api_key(x_api_key: str | None) -> str:
    if not x_api_key:
        raise ApiError(status_code=401, error_type="invalid_api_key", message="Missing X-API-Key header")
    if not x_api_key.startswith("sk_"):
        raise ApiError(status_code=401, error_type="invalid_api_key", message="Invalid API key format")
    return x_api_key


@app.get("/v1/health")
async def v1_health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "uptime_seconds": 0,
        "checks": {"database": "ok", "redis": "ok", "celery": "ok"},
    }


@app.post("/v1/keys/generate", response_model=v1_schemas.KeyGenerateResponse, status_code=201)
async def v1_keys_generate(
    payload: v1_schemas.KeyGenerateRequest,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
):
    _require_api_key(x_api_key)
    key_pair = KeyPair.generate()
    key_id = f"kp_{uuid4().hex[:16]}"
    compressed = point_to_bytes(*key_pair.public_key).hex()
    return v1_schemas.KeyGenerateResponse(
        key_id=key_id,
        public_key=v1_schemas.PublicKeyOut(
            x=format(key_pair.public_key[0], "x"),
            y=format(key_pair.public_key[1], "x"),
            compressed=compressed,
        ),
        private_key=format(key_pair.private_key, "x"),
        created_at=datetime.now(timezone.utc),
        warning="Store the private_key securely. It cannot be retrieved again.",
    )


@app.post("/v1/proofs/create", response_model=v1_schemas.ProofCreateResponse, status_code=201)
async def v1_proofs_create(
    payload: v1_schemas.ProofCreateRequest,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
):
    _require_api_key(x_api_key)
    start = time.perf_counter()
    prover = SchnorrProver(private_key=int(payload.private_key, 16))
    decoded_public_key = bytes_to_point(bytes.fromhex(payload.public_key))
    if prover.public_key != decoded_public_key:
        raise ApiError(
            status_code=400,
            error_type="invalid_request",
            message="Provided private_key does not match the supplied public_key",
        )
    proof = prover.create_proof_with_message(payload.message.encode("utf-8") if payload.message else None)
    elapsed_ms = (time.perf_counter() - start) * 1000
    return v1_schemas.ProofCreateResponse(
        proof_id=generate_proof_id(),
        proof=v1_schemas.ProofPayload(
            commitment=v1_schemas.ProofCommitment(
                x=format(proof.commitment_x, "x"),
                y=format(proof.commitment_y, "x"),
            ),
            challenge=format(proof.challenge, "x"),
            response=format(proof.response, "x"),
            message_hash=proof.message_hash,
        ),
        rounds=payload.rounds,
        created_at=datetime.now(timezone.utc),
        latency_ms=elapsed_ms,
    )


@app.post("/v1/proofs/verify", response_model=v1_schemas.ProofVerifyResponse)
async def v1_proofs_verify(
    payload: v1_schemas.ProofVerifyRequest,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
):
    _require_api_key(x_api_key)
    start = time.perf_counter()
    verifier = SchnorrVerifier(public_key=bytes_to_point(bytes.fromhex(payload.public_key)))
    proof = Proof(
        commitment_x=int(payload.proof.commitment.x, 16),
        commitment_y=int(payload.proof.commitment.y, 16),
        challenge=int(payload.proof.challenge, 16),
        response=int(payload.proof.response, 16),
        message_hash=payload.proof.message_hash,
    )
    if payload.message:
        valid = verifier.verify_with_message(proof, payload.message.encode("utf-8"))
    else:
        valid = verifier.verify(proof)
    if not valid:
        raise ApiError(status_code=400, error_type="proof_invalid", message="Submitted proof is invalid")
    elapsed_ms = (time.perf_counter() - start) * 1000
    return v1_schemas.ProofVerifyResponse(
        valid=True,
        proof_id=generate_proof_id(),
        verification_id=f"vrf_{uuid4().hex[:16]}",
        latency_ms=elapsed_ms,
        verified_at=datetime.now(timezone.utc),
    )


@app.post("/v1/auth/challenge", response_model=v1_schemas.AuthChallengeResponse, status_code=201)
async def v1_auth_challenge(
    payload: v1_schemas.AuthChallengeRequest,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
):
    _require_api_key(x_api_key)
    challenge = ChallengeGenerator.create_auth_challenge(payload.ttl_seconds)
    _AUTH_CHALLENGES[challenge.challenge_id] = {
        "nonce": challenge.nonce,
        "public_key": payload.public_key,
        "session_id": payload.session_id,
        "expires_at": challenge.expires_at,
    }
    _AUTH_CHALLENGES[challenge.challenge_id]["nonce_message"] = challenge.nonce.encode("utf-8")
    return v1_schemas.AuthChallengeResponse(
        challenge_id=challenge.challenge_id,
        challenge_nonce=challenge.nonce,
        public_key=payload.public_key,
        expires_at=challenge.expires_at,
        ttl_seconds=payload.ttl_seconds,
    )


@app.post("/v1/auth/respond", response_model=v1_schemas.AuthRespondResponse)
async def v1_auth_respond(
    payload: v1_schemas.AuthRespondRequest,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
):
    _require_api_key(x_api_key)
    challenge = _AUTH_CHALLENGES.get(payload.challenge_id)
    if challenge is None:
        raise ApiError(status_code=404, error_type="not_found", message="Challenge not found")
    if datetime.now(timezone.utc) > challenge["expires_at"]:
        raise ApiError(status_code=410, error_type="challenge_expired", message="Challenge has expired")

    proof = Proof(
        commitment_x=int(payload.proof.commitment.x, 16),
        commitment_y=int(payload.proof.commitment.y, 16),
        challenge=int(payload.proof.challenge, 16),
        response=int(payload.proof.response, 16),
        message_hash=payload.proof.message_hash,
    )
    public_key = bytes_to_point(bytes.fromhex(challenge["public_key"]))
    verifier = SchnorrVerifier(public_key=public_key)
    nonce = challenge["nonce_message"]
    start = time.perf_counter()
    valid = verifier.verify_with_message(proof, nonce)
    elapsed_ms = (time.perf_counter() - start) * 1000
    if not valid:
        return v1_schemas.AuthRespondResponse(
            authenticated=False,
            challenge_id=payload.challenge_id,
            error="proof_invalid",
            message="The submitted proof does not match the challenge",
        )
    return v1_schemas.AuthRespondResponse(
        authenticated=True,
        challenge_id=payload.challenge_id,
        session_id=challenge["session_id"],
        verified_at=datetime.now(timezone.utc),
        latency_ms=elapsed_ms,
    )


@app.get("/v1/usage", response_model=v1_schemas.UsageResponse)
async def v1_usage(x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None):
    _require_api_key(x_api_key)
    return v1_schemas.UsageResponse(
        org_id="org_demo",
        plan="free",
        current_period=datetime.now(timezone.utc).strftime("%Y-%m"),
        usage={
            "proof_creates": v1_schemas.UsageBucket(used=0, limit=1000, remaining=1000),
            "proof_verifies": v1_schemas.UsageBucket(used=0, limit=5000, remaining=5000),
            "key_generates": v1_schemas.UsageBucket(used=0, limit=None, remaining=None),
        },
        rate_limit={"requests_per_minute": 100, "current_minute_usage": 0},
    )


# Legacy demo endpoints retained for compatibility.
@app.post("/zkp_prove")
async def zkp_prove(payload: models.ProveRequest, conn: DbConn):
    secret = models.derive_secret_scalar(payload.secret)
    batch = payload.batch_size or 1
    statements = [payload.statement for _ in range(batch)]
    secrets_list = [secret] * batch
    bundles, proof_time, mem = metrics.timed_sync(zkp.batch_prove, secrets_list, statements, payload.rounds)
    verify_ok, verify_time, _ = metrics.timed_sync(zkp.batch_verify, bundles)
    await metrics.insert_metric(
        conn,
        app_type=payload.app_type.value,
        input_size=batch,
        proof_time=proof_time,
        verify_time=verify_time,
        mem_mb=mem,
        success=bool(verify_ok),
        rounds=payload.rounds,
    )
    entropy_value = bundles[0].get("entropy", 0.0) if bundles else 0.0
    logger.log_event("prove", app=payload.app_type.value, rounds=payload.rounds, entropy=entropy_value)
    return {"bundles": bundles, "metrics": {"proof_time": proof_time, "verify_time": verify_time, "mem_mb": mem}}


@app.post("/zkp_verify")
async def zkp_verify(payload: models.VerifyRequest):
    bundle = payload.bundle
    ok = zkp.batch_verify([bundle.model_dump()])
    if not ok:
        raise HTTPException(status_code=400, detail="Proof verification failed")
    return {"valid": True}


@app.post("/advanced_sim", response_model=models.AdvancedSimResponse)
async def advanced_sim(payload: models.AdvancedSimRequest, conn: DbConn):
    response, meta = await simulations.run_simulation(payload.app_type, conn, payload.rounds, payload.batch_size)
    await metrics.insert_metric(
        conn,
        app_type=payload.app_type.value,
        input_size=meta["input_size"],
        proof_time=meta["proof_time"],
        verify_time=meta["verify_time"],
        mem_mb=meta["mem_mb"],
        success=meta["success"],
        rounds=payload.rounds,
    )
    return response
