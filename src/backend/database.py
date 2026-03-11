"""Async SQLite helpers."""
from __future__ import annotations

import aiosqlite

from config import settings

SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_type TEXT NOT NULL,
        input_size INTEGER NOT NULL,
        proof_time REAL NOT NULL,
        verify_time REAL NOT NULL,
        mem_mb REAL NOT NULL,
        success INTEGER NOT NULL,
        rounds INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS elections (
        voter_hash TEXT PRIMARY KEY,
        proof_json TEXT NOT NULL,
        valid INTEGER NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS ehr (
        record_hash TEXT PRIMARY KEY,
        proof_chain TEXT NOT NULL,
        role TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS supply_chain (
        stage_hash TEXT PRIMARY KEY,
        proof_json TEXT NOT NULL,
        stage_index INTEGER,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS kyc (
        attr_hash TEXT PRIMARY KEY,
        proof_json TEXT NOT NULL,
        session_nonce TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS ml_audits (
        model_id TEXT PRIMARY KEY,
        proof_json TEXT NOT NULL,
        bias_score REAL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS collab_edits (
        edit_hash TEXT PRIMARY KEY,
        proof_json TEXT NOT NULL,
        author TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
]


async def init_db() -> None:
    async with aiosqlite.connect(settings.DB_PATH) as conn:
        for statement in SCHEMA:
            await conn.execute(statement)
        await conn.commit()


async def get_db():
    conn = await aiosqlite.connect(settings.DB_PATH)
    conn.row_factory = aiosqlite.Row
    try:
        yield conn
    finally:
        await conn.close()
