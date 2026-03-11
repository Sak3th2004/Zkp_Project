"""Forensics-style corpora used by medical and collaboration flows."""
from __future__ import annotations

from pathlib import Path
from typing import List

import pandas as pd

from config.settings import DATA_DIR
from src.core.hash_utils import sha256_hex


def _csv(name: str) -> Path:
    return DATA_DIR / name


def load_medical_records(limit: int | None = None) -> list[dict[str, str]]:
    path = _csv("medical_ext.csv")
    if path.exists():
        frame = pd.read_csv(path)
    else:
        frame = pd.DataFrame(
            {
                "record_id": ["R001", "R002"],
                "patient": ["Alex", "Jordan"],
                "diagnosis": ["A", "B"],
                "notes": ["Stable", "Follow-up"],
            }
        )
    if limit:
        frame = frame.head(limit)
    return frame.to_dict(orient="records")


def load_collab_history(limit: int | None = None) -> list[str]:
    path = DATA_DIR / "collab_history.txt"
    if path.exists():
        data = path.read_text().splitlines()
    else:
        data = ["Edit A -> Added compliance clause", "Edit B -> Updated summary"]
    if limit:
        data = data[:limit]
    return data


def record_digest(record: dict[str, str]) -> str:
    payload = f"{record.get('record_id')}|{record.get('patient')}|{record.get('diagnosis')}"
    return sha256_hex([payload])
