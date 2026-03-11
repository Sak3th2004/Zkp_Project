#!/bin/bash
set -euo pipefail
python -m pip install -r requirements.txt
uvicorn src.backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
streamlit run src/frontend/app.py --server.port 8501 --server.headless true &
FRONTEND_PID=$!
wait $BACKEND_PID $FRONTEND_PID
