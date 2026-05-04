"""
Central configuration. All secrets come from environment variables (loaded from .env).
The app works with zero env vars set — paid/key-gated sources are automatically
skipped when their keys are absent.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (one level above backend/)
_ROOT = Path(__file__).parent.parent
load_dotenv(_ROOT / ".env")

# ─── Database ────────────────────────────────────────────────────────────────
DB_PATH = _ROOT / "data" / "leads.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# ─── Optional API keys (None = source disabled) ──────────────────────────────
SERPAPI_KEY: str | None = os.getenv("SERPAPI_KEY") or None
HUNTER_API_KEY: str | None = os.getenv("HUNTER_API_KEY") or None
PROXYCURL_API_KEY: str | None = os.getenv("PROXYCURL_API_KEY") or None
OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY") or None
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

# ─── Scraper settings ────────────────────────────────────────────────────────
REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "15"))
MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "2"))
PLAYWRIGHT_TIMEOUT: int = int(os.getenv("PLAYWRIGHT_TIMEOUT", "20000"))  # ms
USE_PLAYWRIGHT: bool = os.getenv("USE_PLAYWRIGHT", "true").lower() in ("1", "true", "yes")

# ─── Rate-limiting (seconds between requests per source) ─────────────────────
DDG_DELAY: float = float(os.getenv("DDG_DELAY", "2.0"))

# ─── Countries active in this deployment ─────────────────────────────────────
ACTIVE_COUNTRIES = ["India"]

# ─── LLM budget guard ────────────────────────────────────────────────────────
# Maximum LLM calls per search session. 0 = LLM disabled entirely.
LLM_MAX_CALLS_PER_SESSION: int = int(os.getenv("LLM_MAX_CALLS_PER_SESSION", "0"))
