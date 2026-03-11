# Application of Zero Knowledge Proof Cryptographic Algorithm

## Overview
A full-stack demonstrator that applies non-interactive Schnorr zero-knowledge proofs (secp256k1 + SHA-256 commitments) across six enterprise-grade workflows: secure voting, medical data sharing, supply chain provenance, identity verification, ML model auditing, and collaborative editing.

## Key Capabilities
- FastAPI backend with vectorized, multi-round Schnorr proof generation and verification.
- Streamlit dashboard for driving simulations, uploading custom payloads, and viewing metrics.
- SQLite persistence for metrics and per-application audit trails (elections, EHR, supply chain stages, KYC entries, ML audits, collaboration edits).
- Monitoring hooks for entropy tracking, proof/verify timing, and tamper detection (Attack Test flow).
- Dataset loaders for synthetic data plus support for reviewer-provided JSON/CSV/TXT uploads.

## Repository Layout
```
config/              Curve, DB, and system constants
src/core/            Schnorr math + hashing utilities
src/backend/         FastAPI app, models, simulations, DB helpers
src/frontend/        Streamlit dashboard
src/datasets/        Dataset loaders
src/monitoring/      Timing + structured logging utilities
src/tests/           Pytest suite (core, integration, attack scenarios)
data/                Sample datasets (voters, medical, supply, identity, edits, ML weights)
scripts/             Deploy/test helpers, locustfile, API caller
notebooks/           Analysis notebook for metrics visualization
Dockerfile           Combined backend + frontend image
```

## Prerequisites
- Python 3.12+
- Node is not required (Streamlit handles frontend)
- (Optional) Docker / Docker Compose

## Local Setup
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Stack
### Separate terminals
```bash
# Terminal 1: backend
venv\Scripts\activate
uvicorn src.backend.main:app --host 0.0.0.0 --port 8000

# Terminal 2: frontend
venv\Scripts\activate
python -m streamlit run src/frontend/app.py --server.port 8501 --server.headless true
```
Navigate to http://localhost:8501.

### Docker Compose
```bash
docker compose up --build
```
Backend listens on :8000, Streamlit on :8501.

## Using the Dashboard
1. Choose an application from the sidebar (voting, medical, supply, identity, ml_audit, collab_edit).
2. Adjust rounds (1–5) and batch size (1–10000). Higher rounds increase soundness.
3. (Optional) Upload JSON/CSV/TXT data. Uploaded payloads are hashed before proof generation.
4. Click **Run ZKP Chain Sim**. Results show chain validity, entropy, proof/verify times, and aggregates. Metrics are stored in `zkp.db`.
5. Click **Attack Test** to demonstrate tamper rejection (backend returns HTTP 400 for the mutated proof).

## Inspecting Backend Results
```bash
venv\Scripts\activate
sqlite3 zkp.db "SELECT * FROM metrics ORDER BY id DESC LIMIT 5;"
sqlite3 zkp.db "SELECT voter_hash, valid FROM elections LIMIT 5;"  # replace with ehr, supply_chain, kyc, ml_audits, collab_edits
```
Logs from Uvicorn show entropy values and per-request timing (structlog JSON lines).

## Testing
```bash
venv\Scripts\activate
pytest -q
```
For load simulation:
```bash
locust -f scripts/locustfile.py --headless -u 50 -r 10 --run-time 30s
```

## Analysis Notebook
Run `notebooks/analysis.ipynb` (after generating metrics) to plot proof/verify times per application.

## Deployment Script
`scripts/deploy.sh` installs requirements and launches both servers. `scripts/test_full.sh` runs pytest and locust sequentially.

## CI/CD or Further Automation
- Add GitHub Actions to run `pytest -q` on pull requests.
- Publish Docker image (`docker build -t zkp-app .`) and push to registry for cloud deployment.

## Version Control Workflow
1. Initialize repo and add remote:
```bash
git init
git remote add origin https://github.com/Sak3th2004/Zkp_Project.git
```
2. Track files and commit:
```bash
git add .
git commit -m "Add ZKP application stack"
```
3. Push to GitHub:
```bash
git push -u origin main
```
If `main` doesn’t exist yet, create it (`git branch -M main`).

## Future Enhancements
- Add authentication around the dashboard and APIs.
- Integrate a message queue for large batch jobs.
- Provide exportable audit reports (PDF/CSV) per application run.
- Extend dataset loaders to fetch from live sources (e.g., REST APIs) with anonymization filters.
