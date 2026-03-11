"""Synthetic datasets supporting large-scale simulations."""
from __future__ import annotations

import json
from pathlib import Path
from typing import List

import numpy as np

from config.settings import DATA_DIR
from src.core.hash_utils import sha256_hex


def _json(name: str) -> Path:
    return DATA_DIR / name


def load_voting_sample(limit: int | None = None) -> list[dict[str, str]]:
    path = _json("voting_sample.json")
    if path.exists():
        data = json.loads(path.read_text())
    else:
        data = [{"voter_id": f"V{i:05d}", "choice": "YES" if i % 2 == 0 else "NO"} for i in range(100)]
    if limit:
        data = data[:limit]
    return data


def load_supply_chain_items() -> list[dict[str, str]]:
    path = _json("supply_stages.json")
    if path.exists():
        return json.loads(path.read_text())
    entries: list[dict[str, str]] = []
    for idx in range(10):
        entries.append({"stage": f"Stage-{idx}", "doc": f"DOC-{idx}", "gps": f"{idx}.0,{idx}.5"})
    return entries


def synthetic_statements(count: int) -> list[str]:
    values = np.random.randint(1_000_000, 9_999_999, size=count, dtype=np.int64)
    return [sha256_hex([int(val).to_bytes(8, "big")]) for val in values]
