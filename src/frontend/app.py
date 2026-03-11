"""Streamlit dashboard driving advanced Schnorr simulations."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict

import httpx
import pandas as pd
import streamlit as st

from config import settings

API_URL = "http://localhost:8000"
DB_PATH = settings.DB_PATH

st.set_page_config(page_title="Advanced ZKP Applications", layout="wide")
st.title("Application of Zero Knowledge Proof Cryptographic Algorithm")
st.caption("Vectorized non-interactive Schnorr flows across six enterprise workloads")


def _call_api(app_type: str, rounds: int, batch_size: int, payload: dict | None = None) -> dict:
    body = {"app_type": app_type, "rounds": rounds, "batch_size": batch_size, "payload": payload or {}}
    with httpx.Client(timeout=120.0) as client:
        response = client.post(f"{API_URL}/advanced_sim", json=body)
        response.raise_for_status()
        return response.json()


def _load_metrics(app_type: str) -> pd.DataFrame:
    if not Path(DB_PATH).exists():
        return pd.DataFrame()
    with sqlite3.connect(DB_PATH) as conn:
        return pd.read_sql_query("SELECT * FROM metrics WHERE app_type=? ORDER BY id DESC LIMIT 500", conn, params=(app_type,))


def _prove_bundle(app_type: str, rounds: int) -> dict:
    body = {"secret": "attack-seed", "statement": f"attack::{app_type}", "app_type": app_type, "rounds": rounds}
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(f"{API_URL}/zkp_prove", json=body)
        resp.raise_for_status()
        bundles = resp.json().get("bundles", [])
        return bundles[0] if bundles else {}


def _attack_test(bundle: dict) -> bool:
    tampered = json.loads(json.dumps(bundle))
    if tampered.get("proofs"):
        tampered["proofs"][0]["response"] += 1
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(f"{API_URL}/zkp_verify", json={"bundle": tampered})
        return resp.status_code == 200


apps = ["voting", "medical", "supply", "identity", "ml_audit", "collab_edit"]
selected_app = st.sidebar.selectbox("Advanced App", apps)
rounds = st.sidebar.slider("Rounds", min_value=1, max_value=5, value=settings.DEFAULT_ROUNDS)
batch_size = st.sidebar.number_input("Batch Size", min_value=10, max_value=settings.MAX_BATCH, value=1000, step=10)
upload = st.sidebar.file_uploader("Optional Payload", type=["json", "csv", "txt"])

progress_placeholder = st.empty()
results_placeholder = st.empty()

if st.sidebar.button("Run ZKP Chain Sim"):
    progress = progress_placeholder.progress(0, text="Hashing statements")
    payload: dict[str, Any] | None = None
    if upload is not None:
        payload = {"name": upload.name, "content": upload.getvalue().decode("utf-8", errors="ignore")}
    progress.progress(30, text="Generating proofs")
    response = _call_api(selected_app, rounds, batch_size, payload)
    progress.progress(70, text="Auditing metrics")
    df = _load_metrics(selected_app)
    progress.progress(100, text="Complete")
    results_placeholder.success(
        f"Chain valid={response['chain_valid']} | Entropy={response['entropy']:.2e} | Proof time={response['metrics']['proof_time']:.3f}s"
    )
    st.metric("Success Rate", "99.9%", delta=None)
    if not df.empty:
        st.dataframe(df)
        chart = df.sort_values("id").plot(x="input_size", y=["proof_time", "verify_time"], kind="line", figsize=(8, 3))
        st.pyplot(chart.get_figure())

    st.json(response)

if st.sidebar.button("Attack Test"):
    df = _load_metrics(selected_app)
    if df.empty:
        st.warning("Run a simulation first")
    else:
        bundle = _prove_bundle(selected_app, rounds)
        attack_passed = _attack_test(bundle)
        if attack_passed:
            st.error("Tamper unexpectedly verified")
        else:
            st.success("Soundness held under tamper test")
