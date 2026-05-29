#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  LeadGen Engine — Linux/macOS start script
#  Run:  bash start.sh
#  Then open http://localhost:8000 in your browser.
# ═══════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo ""
echo "  ======================================================"
echo "   LeadGen Engine — Starting up..."
echo "  ======================================================"
echo ""

# ── Python check ─────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "  ERROR: python3 not found. Install Python 3.10+ first."
    exit 1
fi

# ── Virtual environment ───────────────────────────────────────────────────────
if [ ! -d ".venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# ── Dependencies ─────────────────────────────────────────────────────────────
echo "  Installing dependencies..."
pip install -q -r requirements.txt

# ── Playwright (optional, for JS-rendered pages) ─────────────────────────────
pip install -q playwright
playwright install chromium --with-deps 2>/dev/null || true

# ── .env ─────────────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo "  No .env found — copying .env.example → .env"
    cp .env.example .env
fi

# ── Launch ────────────────────────────────────────────────────────────────────
echo ""
echo "  App running at: http://localhost:8000"
echo "  Press Ctrl+C to stop."
echo ""

# Try to open browser
if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:8000 &
elif command -v open &>/dev/null; then
    open http://localhost:8000 &
fi

python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
