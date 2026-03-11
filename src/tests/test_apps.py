from __future__ import annotations

import asyncio
import pytest

from src.backend import database, models, simulations


@pytest.mark.asyncio
async def test_all_app_simulations(tmp_path):
    await database.init_db()
    async for conn in database.get_db():
        for app in models.AppType:
            response, meta = await simulations.run_simulation(app, conn, rounds=1, batch_size=10)
            assert response.chain_valid is True
            assert meta["input_size"] > 0
        break
