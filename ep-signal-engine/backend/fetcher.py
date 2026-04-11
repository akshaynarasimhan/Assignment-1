"""
Backward-compatible shim.
Direct ticker-level fetching now lives in news_sources.py.
This module is kept for legacy API compatibility.
"""
from news_sources import fetch_yfinance_for_ticker as fetch_news_for_ticker, _headline_hash as _hash_headline

__all__ = ["fetch_news_for_ticker", "_hash_headline"]
