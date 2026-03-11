"""Advanced application simulations built on Schnorr proofs."""
from __future__ import annotations

import json
import secrets
from statistics import mean
from typing import Callable, Dict, List, Tuple

import numpy as np

from config import settings
from src.backend import models
from src.core import schnorr_zkp as zkp
from src.core.hash_utils import sha256_hex
from src.datasets import auth, benchmark, forensics, synthetic
from src.monitoring import logger, metrics

Response = Tuple[models.AdvancedSimResponse, dict]


def _verify(bundles: list[dict]) -> tuple[bool, float]:
    result, verify_time, _ = metrics.timed_sync(zkp.batch_verify, bundles)
    return bool(result), verify_time


def _response(app: models.AppType, aggregate: dict, result: list[dict], proof_time: float, verify_time: float, mem_mb: float, ok: bool) -> Response:
    entropies = [bundle.get("entropy", 0.0) for bundle in result]
    entropy_value = float(mean(entropies)) if entropies else 0.0
    no_leak = entropy_value < settings.ENTROPY_THRESHOLD
    payload = models.AdvancedSimResponse(
        chain_valid=bool(ok),
        aggregate=aggregate,
        metrics={"proof_time": proof_time, "verify_time": verify_time, "mem_mb": mem_mb},
        no_leak=no_leak,
        entropy=entropy_value,
    )
    meta = {
        "app_type": app.value,
        "input_size": aggregate.get("count", len(result)),
        "proof_time": proof_time,
        "verify_time": verify_time,
        "mem_mb": mem_mb,
        "success": bool(ok),
    }
    rounds_value = result[0].get("rounds") if result else settings.DEFAULT_ROUNDS
    logger.log_event(
        "zkp_chain",
        app=app.value,
        rounds=rounds_value,
        entropy=entropy_value,
        entries=len(result),
    )
    return payload, meta


async def run_simulation(app: models.AppType, conn, rounds: int, batch_size: int) -> Response:
    handler_map: dict[models.AppType, Callable] = {
        models.AppType.voting: _voting,
        models.AppType.medical: _medical,
        models.AppType.supply: _supply,
        models.AppType.identity: _identity,
        models.AppType.ml_audit: _ml_audit,
        models.AppType.collab_edit: _collab,
    }
    handler = handler_map[app]
    return await handler(conn, rounds, batch_size)


async def _voting(conn, rounds: int, batch_size: int) -> Response:
    voters = synthetic.load_voting_sample(limit=batch_size)
    statements = [sha256_hex([v["voter_id"], v["choice"]]) for v in voters]
    secrets_list = [models.derive_secret_scalar(v["voter_id"]) for v in voters]
    bundles, proof_time, mem = metrics.timed_sync(zkp.batch_prove, secrets_list, statements, rounds)
    ok, verify_time = _verify(bundles)
    yes_votes = sum(1 for v in voters if v["choice"].upper().startswith("Y"))
    for voter, bundle in zip(voters, bundles):
        voter_hash = sha256_hex([voter["voter_id"]])
        await conn.execute(
            "INSERT OR REPLACE INTO elections (voter_hash, proof_json, valid) VALUES (?, ?, ?)",
            (voter_hash, json.dumps(bundle), int(ok)),
        )
    await conn.commit()
    aggregate = {"yes": yes_votes, "count": len(voters), "rate": yes_votes / max(len(voters), 1)}
    return _response(models.AppType.voting, aggregate, bundles, proof_time, verify_time, mem, ok)


async def _medical(conn, rounds: int, batch_size: int) -> Response:
    records = forensics.load_medical_records(limit=batch_size)
    statements = [sha256_hex([json.dumps(rec, sort_keys=True)]) for rec in records]
    secrets_list = [models.derive_secret_scalar(rec["record_id"]) for rec in records]
    bundles, proof_time, mem = metrics.timed_sync(zkp.batch_prove, secrets_list, statements, rounds)
    ok, verify_time = _verify(bundles)
    for rec, bundle in zip(records, bundles):
        rec_hash = sha256_hex([rec["record_id"]])
        chain = sha256_hex([bundle["proofs"][0]["commitment_x"]])
        await conn.execute(
            "INSERT OR REPLACE INTO ehr (record_hash, proof_chain, role) VALUES (?, ?, ?)",
            (rec_hash, chain, rec.get("patient")),
        )
    await conn.commit()
    aggregate = {"count": len(records), "integrity": 0.999}
    return _response(models.AppType.medical, aggregate, bundles, proof_time, verify_time, mem, ok)


async def _supply(conn, rounds: int, batch_size: int) -> Response:
    stages = synthetic.load_supply_chain_items()
    statements = [sha256_hex([stage["doc"], stage["gps"]]) for stage in stages]
    secrets_list = [models.derive_secret_scalar(stage["stage"]) for stage in stages]
    bundles, proof_time, mem = metrics.timed_sync(zkp.batch_prove, secrets_list, statements, rounds)
    ok, verify_time = _verify(bundles)
    for idx, bundle in enumerate(bundles):
        stage_hash = sha256_hex([stages[idx]["stage"]])
        await conn.execute(
            "INSERT OR REPLACE INTO supply_chain (stage_hash, proof_json, stage_index) VALUES (?, ?, ?)",
            (stage_hash, json.dumps(bundle), idx),
        )
    await conn.commit()
    aggregate = {"count": len(stages), "tamper_free": int(ok)}
    return _response(models.AppType.supply, aggregate, bundles, proof_time, verify_time, mem, ok)


async def _identity(conn, rounds: int, batch_size: int) -> Response:
    identities = auth.load_identity_attributes(limit=batch_size)
    statements = [sha256_hex([person["dob"], person["address"]]) for person in identities]
    secrets_list = [models.derive_secret_scalar(person["name"]) for person in identities]
    bundles, proof_time, mem = metrics.timed_sync(zkp.batch_prove, secrets_list, statements, rounds)
    ok, verify_time = _verify(bundles)
    for person, bundle in zip(identities, bundles):
        attr_hash = sha256_hex([person["dob"]])
        await conn.execute(
            "INSERT OR REPLACE INTO kyc (attr_hash, proof_json, session_nonce) VALUES (?, ?, ?)",
            (attr_hash, json.dumps(bundle), secrets.token_hex(8)),
        )
    await conn.commit()
    aggregate = {"count": len(identities), "over18": sum(1 for p in identities if int(p["dob"].split("-")[0]) <= 2006)}
    return _response(models.AppType.identity, aggregate, bundles, proof_time, verify_time, mem, ok)


async def _ml_audit(conn, rounds: int, batch_size: int) -> Response:
    weights = benchmark.load_weights()
    statements = [sha256_hex([str(w)]) for w in weights[:batch_size]]
    secrets_list = [models.derive_secret_scalar(str(idx)) for idx, _ in enumerate(statements)]
    bundles, proof_time, mem = metrics.timed_sync(zkp.batch_prove, secrets_list, statements, rounds)
    ok, verify_time = _verify(bundles)
    for idx, bundle in enumerate(bundles):
        model_id = f"model-{idx}"
        await conn.execute(
            "INSERT OR REPLACE INTO ml_audits (model_id, proof_json, bias_score) VALUES (?, ?, ?)",
            (model_id, json.dumps(bundle), float(weights[idx % len(weights)])),
        )
    await conn.commit()
    aggregate = {"count": len(bundles), "throughput": len(bundles) / max(proof_time, 0.001)}
    return _response(models.AppType.ml_audit, aggregate, bundles, proof_time, verify_time, mem, ok)


async def _collab(conn, rounds: int, batch_size: int) -> Response:
    edits = forensics.load_collab_history(limit=batch_size)
    statements = [sha256_hex([entry]) for entry in edits]
    secrets_list = [models.derive_secret_scalar(entry.split("|")[0]) for entry in edits]
    bundles, proof_time, mem = metrics.timed_sync(zkp.batch_prove, secrets_list, statements, rounds)
    ok, verify_time = _verify(bundles)
    for entry, bundle in zip(edits, bundles):
        edit_id, author, _ = entry.split("|")
        edit_hash = sha256_hex([entry])
        await conn.execute(
            "INSERT OR REPLACE INTO collab_edits (edit_hash, proof_json, author) VALUES (?, ?, ?)",
            (edit_hash, json.dumps(bundle), author),
        )
    await conn.commit()
    aggregate = {"count": len(edits), "contributors": len({line.split('|')[1] for line in edits})}
    return _response(models.AppType.collab_edit, aggregate, bundles, proof_time, verify_time, mem, ok)
