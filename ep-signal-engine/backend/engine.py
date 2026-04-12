"""
EP Signal Engine — orchestrates fetching, deduplication, analysis, and persistence.
Uses multi-source news: Economic Times, Moneycontrol, Google/Yahoo, and yfinance.
"""

import logging
from datetime import datetime, timezone

from news_sources import fetch_all_news
from analyzer import analyze_headline
from db import get_watchlist, is_news_processed, save_processed_news, backfill_source_url

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def run_engine() -> list[dict]:
    """
    Full pipeline: multi-source fetch → deduplicate → analyze → persist.
    Returns a list of newly discovered EP signal records.
    """
    watchlist = get_watchlist()
    if not watchlist:
        logger.warning("Watchlist is empty. Add tickers via the dashboard.")
        return []

    all_tickers = [entry["ticker"] for entry in watchlist]
    logger.info("Running EP Signal Engine for %d tickers.", len(all_tickers))

    news_items = fetch_all_news(all_tickers)
    logger.info("Total news items to process: %d", len(news_items))

    new_signals: list[dict] = []

    for item in news_items:
        ticker = item["ticker"]
        headline_hash = item["headline_hash"]

        if is_news_processed(ticker, headline_hash):
            # If we now have a URL for a previously stored record, backfill it
            if item.get("source_url"):
                backfill_source_url(ticker, headline_hash, item["source_url"])
            logger.debug("Already processed: [%s] %s", ticker, item["headline"][:60])
            continue

        analysis = analyze_headline(ticker, item["headline"])

        record = {
            "ticker": ticker,
            "headline": item["headline"],
            "headline_hash": headline_hash,
            "source": item.get("source"),
            "source_url": item.get("source_url"),
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
                "EP SIGNAL [%s] [%s] [%s] %s",
                ticker,
                analysis["relevance_score"],
                item.get("source", ""),
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
            print(f"  [{s['ticker']}] [{s['relevance_score']}] [{s.get('source','')}] {s['headline']}")
    else:
        print("No new EP signals found.")
