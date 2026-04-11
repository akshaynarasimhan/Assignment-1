import hashlib
import logging
from datetime import datetime, timezone

import yfinance as yf

logger = logging.getLogger(__name__)


def fetch_news_for_ticker(ticker: str) -> list[dict]:
    """Fetch recent news headlines for a ticker using yfinance."""
    try:
        stock = yf.Ticker(ticker)
        news_items = stock.news or []
        results = []
        for item in news_items:
            content = item.get("content", {})
            title = content.get("title") or item.get("title", "")
            if not title:
                continue

            pub_date = None
            pub_raw = content.get("pubDate") or item.get("providerPublishTime")
            if pub_raw:
                try:
                    if isinstance(pub_raw, (int, float)):
                        pub_date = datetime.fromtimestamp(pub_raw, tz=timezone.utc).isoformat()
                    else:
                        pub_date = str(pub_raw)
                except Exception:
                    pub_date = None

            provider = content.get("provider", {})
            source = provider.get("displayName") if isinstance(provider, dict) else item.get("publisher", "")

            results.append(
                {
                    "ticker": ticker.upper(),
                    "headline": title,
                    "headline_hash": _hash_headline(ticker, title),
                    "source": source,
                    "published_at": pub_date,
                }
            )
        logger.info("Fetched %d news items for %s", len(results), ticker)
        return results
    except Exception as exc:
        logger.error("Failed to fetch news for %s: %s", ticker, exc)
        return []


def _hash_headline(ticker: str, headline: str) -> str:
    key = f"{ticker.upper()}::{headline.strip().lower()}"
    return hashlib.sha256(key.encode()).hexdigest()
