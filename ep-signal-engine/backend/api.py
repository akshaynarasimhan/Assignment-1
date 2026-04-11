"""
FastAPI backend for the EP Signal Engine dashboard.
Provides REST endpoints consumed by the React frontend.
"""

import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db
from engine import run_engine
from mailer import send_signal_email

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="EP Signal Engine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---

class TickerAdd(BaseModel):
    ticker: str
    company_name: Optional[str] = ""


class RunEngineResponse(BaseModel):
    signals_found: int
    signals: list[dict]


# --- Watchlist endpoints ---

@app.get("/watchlist")
def list_watchlist():
    return db.get_watchlist()


@app.post("/watchlist", status_code=201)
def add_ticker(body: TickerAdd):
    if not body.ticker:
        raise HTTPException(status_code=422, detail="Ticker is required.")
    result = db.add_ticker(body.ticker.upper(), body.company_name or "")
    if not result:
        raise HTTPException(status_code=500, detail="Failed to add ticker.")
    return result


@app.delete("/watchlist/{ticker}")
def remove_ticker(ticker: str):
    db.delete_ticker(ticker.upper())
    return {"message": f"{ticker.upper()} removed from watchlist."}


# --- Signals endpoints ---

@app.get("/signals")
def get_signals(limit: int = 50):
    return db.get_recent_signals(limit=limit)


@app.get("/news")
def get_all_news(limit: int = 100):
    return db.get_all_recent_news(limit=limit)


# --- Engine trigger ---

@app.post("/run", response_model=RunEngineResponse)
def trigger_engine(background_tasks: BackgroundTasks):
    """Trigger a synchronous engine run and return new signals."""
    signals = run_engine()
    if signals:
        background_tasks.add_task(send_signal_email, signals=signals)
    return {"signals_found": len(signals), "signals": signals}


# --- Stats ---

@app.get("/stats")
def get_stats():
    all_news = db.get_all_recent_news(limit=1000)
    signals = [n for n in all_news if n.get("is_ep_signal")]
    return {
        "total_processed": len(all_news),
        "total_signals": len(signals),
        "high": sum(1 for s in signals if s.get("relevance_score") == "High"),
        "medium": sum(1 for s in signals if s.get("relevance_score") == "Medium"),
        "low": sum(1 for s in signals if s.get("relevance_score") == "Low"),
        "watchlist_count": len(db.get_watchlist()),
    }


@app.get("/health")
def health():
    return {"status": "ok"}
