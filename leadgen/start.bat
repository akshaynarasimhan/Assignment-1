@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  LeadGen Engine — One-click Windows start script
REM  Double-click this file to launch the app.
REM  Then open http://localhost:8000 in your browser.
REM ═══════════════════════════════════════════════════════════════════

title Lead Generation Engine

echo.
echo  ======================================================
echo   LeadGen Engine — Starting up...
echo  ======================================================
echo.

REM ── Check Python ────────────────────────────────────────────────────────────
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo  ERROR: Python not found. Install from https://python.org
    pause
    exit /b 1
)

REM ── Create virtualenv if it doesn't exist ────────────────────────────────────
IF NOT EXIST ".venv" (
    echo  Creating virtual environment...
    python -m venv .venv
)

REM ── Activate ────────────────────────────────────────────────────────────────
call .venv\Scripts\activate.bat

REM ── Install / upgrade dependencies ──────────────────────────────────────────
echo  Installing dependencies...
pip install -q -r requirements.txt

REM ── Install Playwright browsers if USE_PLAYWRIGHT is enabled ─────────────────
REM  (comment out the next two lines if you don't want JS-rendered page support)
pip install -q playwright
playwright install chromium --with-deps

REM ── Copy .env if missing ─────────────────────────────────────────────────────
IF NOT EXIST ".env" (
    echo  No .env file found — copying from .env.example
    copy .env.example .env
)

REM ── Launch ────────────────────────────────────────────────────────────────────
echo.
echo  App running at: http://localhost:8000
echo  Press Ctrl+C to stop.
echo.
start "" "http://localhost:8000"

python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

pause
