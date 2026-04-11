"""
EP Signal Engine — orchestrates fetching, deduplication, analysis, and persistence.
"""

import logging
from datetime import datetime, timezone

from fetcher import fetch_news_for_ticker
from analyzer import analyze_headline
from db import get_watchlist, is_news_processed, save_processed_news

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def run_engine() -> list[dict]:
    """
    Full pipeline: fetch → deduplicate → analyze → persist.
    Returns a list of newly discovered EP signal records.
    """
    tickers = get_watchlist()
    if not tickers:
        logger.warning("Watchlist is empty. Add tickers via the dashboard.")
        return []

    logger.info("Running EP Signal Engine for %d tickers.", len(tickers))
    new_signals: list[dict] = []

    for entry in tickers:
        ticker = entry["ticker"]
        news_items = fetch_news_for_ticker(ticker)

        for item in news_items:
            headline_hash = item["headline_hash"]

            if is_news_processed(ticker, headline_hash):
                logger.debug("Already processed: [%s] %s", ticker, item["headline"][:60])
                continue

            analysis = analyze_headline(ticker, item["headline"])

            record = {
                "ticker": ticker,
                "headline": item["headline"],
                "headline_hash": headline_hash,
                "source": item.get("source"),
                "published_at": item.get("published_at"),
                "is_ep_signal": analysis["is_ep_signal"],
                "relevance_score": analysis["relevance_score"],
                "signal_category": analysis["signal_category"],
                "ai_reasoning": analysis["ai_reasoning"],
                "processed_at": datetime.now(tz=timezone.utc).isoformat(),
            }

            save_processed_news(record)

            if analysis["is_ep_signal"]:
                logger.info(
                    "EP SIGNAL [%s] [%s] %s",
                    ticker,
                    analysis["relevance_score"],
                    item["headline"][:80],
                )
                new_signals.append(record)

    logger.info("Engine run complete. %d new EP signals found.", len(new_signals))
    return new_signals


if __name__ == "__main__":
    signals = run_engine()
    if signals:
        print(f"\n{len(signals)} EP Signal(s) found:")
        for s in signals:
            print(f"  [{s['ticker']}] [{s['relevance_score']}] {s['headline']}")
    else:
        print("No new EP signals found.")
