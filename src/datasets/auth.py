"""Identity and authorization samples."""
from __future__ import annotations

import json
from pathlib import Path
from typing import List

from config.settings import DATA_DIR
from src.core.hash_utils import sha256_hex


def _path(name: str) -> Path:
    return DATA_DIR / name


def load_identity_attributes(limit: int | None = None) -> list[dict[str, str]]:
    path = _path("identity_attrs.json")
    if path.exists():
        data = json.loads(path.read_text())
    else:
        data = [
            {"name": "Alex", "dob": "1990-01-01", "address": "221B Baker St"},
            {"name": "Jordan", "dob": "2000-05-17", "address": "742 Evergreen"},
        ]
    if limit:
        data = data[:limit]
    return data


def selective_hash(record: dict[str, str]) -> str:
    target = f"{record.get('dob','')}{record.get('address','')}"
    return sha256_hex([target])
