"""Benchmark helpers for ML audit workloads."""
from __future__ import annotations

from pathlib import Path
from typing import List

import numpy as np

from config.settings import DATA_DIR


def _weights_path() -> Path:
    return DATA_DIR / "ml_weights.npy"


def load_weights(count: int | None = None) -> np.ndarray:
    path = _weights_path()
    if path.exists():
        weights = np.load(path)
    else:
        weights = np.random.default_rng().random(512)
    if count:
        return weights[:count]
    return weights


def benchmark_sizes() -> list[int]:
    return [10, 100, 1_000, 5_000]
