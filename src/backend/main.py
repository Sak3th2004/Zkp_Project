"""FastAPI application exposing Schnorr proof services."""
from __future__ import annotations

from typing import Annotated, Any
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from src.backend import database, models, simulations
from src.core import schnorr_zkp as zkp
from src.monitoring import logger, metrics


@asynccontextmanager
async def lifespan(_: FastAPI):
    await database.init_db()
    yield


app = FastAPI(
    title="Application of Zero Knowledge Proof Cryptographic Algorithm",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DbConn = Annotated[Any, Depends(database.get_db)]


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
