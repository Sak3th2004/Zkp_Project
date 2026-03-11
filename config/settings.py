from pathlib import Path
from py_ecc.secp256k1 import secp256k1

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "zkp.db"

CURVE = secp256k1
CURVE_ORDER = secp256k1.N
GENERATOR = secp256k1.G
FIELD_MODULUS = secp256k1.P

DEFAULT_ROUNDS = 3
MAX_BATCH = 10_000
CHALLENGE_HASH = "sha256"
ENTROPY_THRESHOLD = 1e-6
PROOF_SCHEMA = {"commitment_x", "commitment_y", "challenge", "response"}
