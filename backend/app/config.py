import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / "data"
DATABASE_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "forensiq.db"))
LANL_SAMPLE_PATH = DATA_DIR / "sample" / "lanl_cyber_sample.json"

DEFAULT_MACHINE = "FORENSIQ-PC"
DEFAULT_INVESTIGATOR = "Gopal"
API_V1_STR = "/api"
