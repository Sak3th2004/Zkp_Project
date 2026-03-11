#!/bin/bash
set -euo pipefail
pytest -v --maxfail=1
locust -f scripts/locustfile.py --headless -u 50 -r 10 --run-time 30s
