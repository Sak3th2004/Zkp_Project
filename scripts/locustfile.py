from __future__ import annotations

import random

from locust import HttpUser, between, task

APPS = ["voting", "medical", "supply", "identity", "ml_audit", "collab_edit"]


class ZKPUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def run_simulation(self):
        app = random.choice(APPS)
        payload = {"app_type": app, "rounds": 2, "batch_size": 50}
        self.client.post("/advanced_sim", json=payload)
