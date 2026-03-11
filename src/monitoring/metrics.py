"""Timing utilities and metric persistence."""
from __future__ import annotations

import time
from typing import Any, Awaitable, Callable, Tuple

import psutil

_PROCESS = psutil.Process()


def _memory_mb() -> float:
    return _PROCESS.memory_info().rss / 1_000_000


def timed_sync(func: Callable[..., Any], *args: Any, **kwargs: Any) -> tuple[Any, float, float]:
    start = time.perf_counter()
    before = _memory_mb()
    result = func(*args, **kwargs)
    elapsed = time.perf_counter() - start
    after = _memory_mb()
    return result, elapsed, max(after - before, 0.0)


async def timed_async(func: Callable[..., Awaitable[Any]], *args: Any, **kwargs: Any) -> tuple[Any, float, float]:
    start = time.perf_counter()
    before = _memory_mb()
    result = await func(*args, **kwargs)
    elapsed = time.perf_counter() - start
    after = _memory_mb()
    return result, elapsed, max(after - before, 0.0)


async def insert_metric(conn, *, app_type: str, input_size: int, proof_time: float, verify_time: float, mem_mb: float, success: bool, rounds: int) -> None:
    await conn.execute(
        """
        INSERT INTO metrics (app_type, input_size, proof_time, verify_time, mem_mb, success, rounds)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (app_type, input_size, proof_time, verify_time, mem_mb, int(success), rounds),
    )
    await conn.commit()
