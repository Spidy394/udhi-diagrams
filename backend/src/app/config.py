import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

GEMINI_FALLBACK_MODELS = [
    model.strip()
    for model in os.getenv(
        "GEMINI_FALLBACK_MODELS",
        "gemini-3.1-flash-lite",
    ).split(",")
    if model.strip()
]

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

RESULTS_PATH = BASE_DIR / "results.json"

MAX_API_RETRIES = 3
MAX_VALIDATION_RETRIES = 1

INITIAL_RETRY_DELAY = 5
MAX_OUTPUT_TOKENS = 8192

MODEL_PRICING = {
    "gemini-3.5-flash-lite": {
        "input": 0.30,
        "output": 2.50,
    },
    "gemini-3.1-flash-lite": {
        "input": 0.25,
        "output": 1.50,
    },
}