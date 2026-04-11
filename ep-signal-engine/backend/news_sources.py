"""
Multi-source news fetcher for Indian markets.

Sources:
  1. Economic Times — markets & industry RSS feeds
  2. Moneycontrol — latest news & business RSS feeds
  3. Google News (India Finance) — broad market coverage
  4. Yahoo Finance (yfinance) — ticker-level news

Ticker matching: each headline is scanned for company-name / ticker token
matches against the watchlist to attribute headlines to tickers.
"""

import hashlib
import logging
import re
import time
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from typing import Optional

import feedparser
import yfinance as yf

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# RSS feed definitions
# ---------------------------------------------------------------------------

RSS_FEEDS = [
    {
        "source": "Economic Times",
        "url": "https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms",
        "label": "ET Markets",
    },
    {
        "source": "Economic Times",
        "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "label": "ET Markets General",
    },
    {
        "source": "Economic Times",
        "url": "https://economictimes.indiatimes.com/industry/rssfeeds/13352306.cms",
        "label": "ET Industry",
    },
    {
        "source": "Economic Times",
        "url": "https://economictimes.indiatimes.com/news/company/corporate-trends/rssfeeds/2143429.cms",
        "label": "ET Corporate",
    },
    {
        "source": "Moneycontrol",
        "url": "https://www.moneycontrol.com/rss/latestnews.xml",
        "label": "MC Latest",
    },
    {
        "source": "Moneycontrol",
        "url": "https://www.moneycontrol.com/rss/business.xml",
        "label": "MC Business",
    },
    {
        "source": "Moneycontrol",
        "url": "https://www.moneycontrol.com/rss/marketreports.xml",
        "label": "MC Market Reports",
    },
    {
        "source": "Yahoo Finance",
        "url": "https://news.google.com/rss/search?q=NSE+BSE+India+stock+earnings+merger+results&hl=en-IN&gl=IN&ceid=IN:en",
        "label": "Google News India",
    },
    {
        "source": "Yahoo Finance",
        "url": "https://finance.yahoo.com/rss/topfinstories",
        "label": "Yahoo Finance Top",
    },
]

# ---------------------------------------------------------------------------
# Ticker → keyword mapping for attribution
# Covers plain ticker symbol, common abbreviations, and key name tokens.
# ---------------------------------------------------------------------------

TICKER_KEYWORDS: dict[str, list[str]] = {
    # PSU Banks
    "SBIN.NS": ["sbi", "state bank of india", "sbin"],
    "PNB.NS": ["pnb", "punjab national bank"],
    "INDIANB.NS": ["indian bank", "indianb"],
    "UNIONBANK.NS": ["union bank", "unionbank"],
    "BANKBARODA.NS": ["bank of baroda", "bob", "bankbaroda"],
    "CANBK.NS": ["canara bank", "canbk"],
    "BANKINDIA.NS": ["bank of india", "bankindia"],
    "MAHABANK.NS": ["bank of maharashtra", "mahabank"],
    "CENTRALBK.NS": ["central bank of india", "centralbk"],
    "IDBI.NS": ["idbi bank", "idbi"],
    # Private Banks
    "HDFCBANK.NS": ["hdfc bank", "hdfcbank"],
    "ICICIBANK.NS": ["icici bank", "icicibank"],
    "AXISBANK.NS": ["axis bank", "axisbank"],
    "KOTAKBANK.NS": ["kotak mahindra bank", "kotak bank", "kotakbank"],
    "INDUSINDBK.NS": ["indusind bank", "indusindbk"],
    "YESBANK.NS": ["yes bank", "yesbank"],
    "BANDHANBNK.NS": ["bandhan bank", "bandhanbnk"],
    "IDFCFIRSTB.NS": ["idfc first bank", "idfcfirstb"],
    "FEDERALBNK.NS": ["federal bank", "federalbnk"],
    "RBLBANK.NS": ["rbl bank", "rblbank"],
    "SOUTHBANK.NS": ["south indian bank", "southbank"],
    "EQUITASBNK.NS": ["equitas small finance", "equitas bank", "equitasbnk"],
    "UJJIVANSFB.NS": ["ujjivan small finance", "ujjivansfb"],
    "SURYODAY.NS": ["suryoday small finance", "suryoday"],
    "KARURVYSYA.NS": ["karur vysya", "kvb", "karurvysya"],
    "TMB.NS": ["tamilnad mercantile bank", "tmb"],
    "AUBANK.NS": ["au small finance bank", "au bank", "aubank"],
    # Pharma
    "SUNPHARMA.NS": ["sun pharma", "sun pharmaceutical", "sunpharma"],
    "DRREDDY.NS": ["dr reddy", "dr. reddy", "drreddy"],
    "CIPLA.NS": ["cipla"],
    "LUPIN.NS": ["lupin"],
    "DIVISLAB.NS": ["divi's", "divi laboratories", "divislab"],
    "AUROPHARMA.NS": ["aurobindo pharma", "auropharma"],
    "BIOCON.NS": ["biocon"],
    "ZYDUSLIFE.NS": ["zydus lifesciences", "cadila", "zyduslife"],
    "GLENMARK.NS": ["glenmark", "glenmark pharma"],
    "TORNTPHARM.NS": ["torrent pharma", "torntpharm"],
    "LAURUSLABS.NS": ["laurus labs", "lauruslabs"],
    "MANKIND.NS": ["mankind pharma", "mankind"],
    "ALKEM.NS": ["alkem lab", "alkem"],
    "NATCOPHARM.NS": ["natco pharma", "natcopharm"],
    "AJANTPHARM.NS": ["ajanta pharma", "ajantpharm"],
    "IPCALAB.NS": ["ipca lab", "ipcalab"],
    "GLAND.NS": ["gland pharma", "gland"],
    "METROPOLIS.NS": ["metropolis healthcare", "metropolis"],
    "LALPATHLAB.NS": ["dr lal pathlab", "lal pathlab", "lalpathlab"],
    "SANOFI.NS": ["sanofi india", "sanofi"],
    "PPLPHARMA.NS": ["ppl pharma", "pplpharma"],
    "AARTIPHARM.NS": ["aarti pharmalabs", "aartipharm"],
    "MOREPENLAB.NS": ["morepen lab", "morepenlab"],
    # IT
    "TCS.NS": ["tcs", "tata consultancy", "tata consulting"],
    "INFY.NS": ["infosys", "infy"],
    "HCLTECH.NS": ["hcl tech", "hcl technologies", "hcltech"],
    "WIPRO.NS": ["wipro"],
    "TECHM.NS": ["tech mahindra", "techm"],
    "COFORGE.NS": ["coforge"],
    "KPITTECH.NS": ["kpit tech", "kpittech"],
    "MPHASIS.NS": ["mphasis"],
    "LTM.NS": ["ltimindtree", "lti mindtree", "ltm"],
    # Auto / Metal / Oil
    "M&M.NS": ["mahindra & mahindra", "mahindra and mahindra", "m&m", "mahindra"],
    "EICHERMOT.NS": ["eicher motors", "eichermot"],
    "BAJAJ_AUTO.NS": ["bajaj auto"],
    "ASHOKLEY.NS": ["ashok leyland", "ashokley"],
    "MOTHERSON.NS": ["samvardhana motherson", "motherson sumi", "motherson"],
    "JSWSTEEL.NS": ["jsw steel", "jswsteel"],
    "TATASTEEL.NS": ["tata steel", "tatasteel"],
    "GAIL.NS": ["gail india", "gail"],
    "OIL.NS": ["oil india", "oinl"],
    "IGL.NS": ["indraprastha gas", "igl"],
    "MGL.NS": ["mahanagar gas", "mgl"],
    "GUJGASLTD.NS": ["gujarat gas", "gujgasltd"],
    # NBFC
    "BAJFINANCE.NS": ["bajaj finance", "bajfinance"],
    "BAJAJFINSV.NS": ["bajaj finserv", "bajajfinsv"],
    "JIOFIN.NS": ["jio financial", "jiofin"],
    "PNBHOUSING.NS": ["pnb housing", "pnbhousing"],
    "MANAPPURAM.NS": ["manappuram finance", "manappuram"],
    "SBICARD.NS": ["sbi cards", "sbi card", "sbicard"],
    "CHOLAFIN.NS": ["cholamandalam investment", "chola finance", "cholafin"],
    "CHOLAHLDNG.NS": ["cholamandalam financial", "cholahldng"],
    "SHRIRAMFIN.NS": ["shriram finance", "shriramfin"],
    "M&MFIN.NS": ["mahindra finance", "m&m financial", "m&mfin"],
    # Cement
    "ULTRACEMCO.NS": ["ultratech cement", "ultracemco"],
    "SHREECEM.NS": ["shree cement", "shreecem"],
    "AMBUJACEM.NS": ["ambuja cement", "ambujacem"],
    "RAMCOCEM.NS": ["ramco cement", "ramcocem"],
    "JKLAKSHMI.NS": ["jk lakshmi cement", "jklakshmi"],
    "JSWCEMENT.NS": ["jsw cement", "jswcement"],
    "INDIACEM.NS": ["india cements", "indiacem"],
    "ACC.NS": ["acc limited", "acc cement"],
    # Logistics / Delivery
    "IRCTC.NS": ["irctc"],
    "INDIGO.NS": ["interglobe aviation", "indigo airlines", "indigo"],
    "CONCOR.NS": ["container corporation", "concor"],
    "IRFC.NS": ["irfc", "indian railway finance"],
    "SWIGGY.NS": ["swiggy"],
    "TRENT.NS": ["trent", "westside"],
    "DMART.NS": ["dmart", "avenue supermarts"],
    "ETERNAL.NS": ["eternal", "zomato"],
    # Others
    "CDSL.NS": ["cdsl", "central depository services"],
    "NSDL.BO": ["nsdl", "national securities depository"],
    "TEJASNET.NS": ["tejas networks", "tejasnet"],
    "KTKBANK.NS": ["karnataka bank", "ktkbank"],
    "IOB.NS": ["indian overseas bank", "iob"],
    "NETWORK18.NS": ["network18", "network 18"],
    "PGINVIT.NS": ["powergrid infrastructure invit", "pginvit"],
    "DEN.NS": ["den networks"],
    "JINDALSAW.NS": ["jindal saw", "jindalsaw"],
    "JYOTHYLAB.NS": ["jyothy labs", "jyothylab"],
    "EPACK.NS": ["epack durable", "epack"],
    "TMCV.NS": ["tata motors commercial", "tmcv"],
    "ZYDUSWELL.NS": ["zydus wellness", "zyduswell"],
    "BALUFORGE.NS": ["balu forge", "baluforge"],
    "ANTHEM.NS": ["anthem biosciences", "anthem"],
    "HEXT.NS": ["hext financial", "hext"],
    "FINCABLES.NS": ["finolex cables", "fincables"],
    "WABAG.NS": ["va tech wabag", "wabag"],
    "IDBI.NS": ["idbi bank"],
    "SOUTHBANK.NS": ["south indian bank"],
}


def _parse_pub_date(entry) -> Optional[str]:
    """Parse feedparser entry published date to ISO string."""
    for attr in ("published", "updated", "created"):
        raw = getattr(entry, attr, None)
        if raw:
            try:
                dt = parsedate_to_datetime(raw)
                return dt.astimezone(timezone.utc).isoformat()
            except Exception:
                pass
    return None


def _headline_hash(ticker: str, headline: str) -> str:
    key = f"{ticker.upper()}::{headline.strip().lower()}"
    return hashlib.sha256(key.encode()).hexdigest()


def _match_tickers(text: str, all_tickers: list[str]) -> list[str]:
    """Return list of tickers that match the given text."""
    lower = text.lower()
    matched = []
    for ticker in all_tickers:
        keywords = TICKER_KEYWORDS.get(ticker, [])
        # Fall back to bare ticker symbol (strip .NS/.BO)
        if not keywords:
            bare = ticker.replace(".NS", "").replace(".BO", "").lower()
            keywords = [bare]
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", lower):
                matched.append(ticker)
                break
    return matched


def fetch_rss_all(all_tickers: list[str]) -> list[dict]:
    """
    Fetch all RSS feeds and match headlines to tickers.
    Returns a flat list of news items: {ticker, headline, headline_hash, source, published_at}.
    """
    raw_items: list[tuple[str, str, str, Optional[str]]] = []  # (title, link, source, pub_date)

    for feed_def in RSS_FEEDS:
        try:
            feed = feedparser.parse(
                feed_def["url"],
                request_headers={"User-Agent": "Mozilla/5.0 (EP Signal Engine)"},
            )
            entries = feed.entries or []
            for entry in entries:
                title = (getattr(entry, "title", "") or "").strip()
                if not title:
                    continue
                pub_date = _parse_pub_date(entry)
                raw_items.append((title, feed_def["label"], pub_date))
            logger.info("RSS [%s]: %d articles", feed_def["label"], len(entries))
        except Exception as exc:
            logger.warning("RSS feed failed [%s]: %s", feed_def["label"], exc)
        time.sleep(0.15)  # polite rate limiting

    results: list[dict] = []
    for title, source_label, pub_date in raw_items:
        matched = _match_tickers(title, all_tickers)
        for ticker in matched:
            results.append(
                {
                    "ticker": ticker,
                    "headline": title,
                    "headline_hash": _headline_hash(ticker, title),
                    "source": source_label,
                    "published_at": pub_date,
                }
            )

    logger.info("RSS: %d headline-ticker pairs from %d raw articles", len(results), len(raw_items))
    return results


def fetch_yfinance_for_ticker(ticker: str) -> list[dict]:
    """Fetch yfinance news for a single ticker (unchanged from original fetcher)."""
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
                    "headline_hash": _headline_hash(ticker, title),
                    "source": source or "Yahoo Finance",
                    "published_at": pub_date,
                }
            )
        return results
    except Exception as exc:
        logger.error("yfinance failed for %s: %s", ticker, exc)
        return []


def fetch_all_news(all_tickers: list[str]) -> list[dict]:
    """
    Master fetch: combines RSS (ET + MC + Google/Yahoo) and yfinance.
    Returns deduplicated list by (ticker, headline_hash).
    """
    logger.info("Fetching news from all sources for %d tickers...", len(all_tickers))
    seen: set[str] = set()
    combined: list[dict] = []

    # --- RSS sources first (broader coverage) ---
    rss_items = fetch_rss_all(all_tickers)
    for item in rss_items:
        key = f"{item['ticker']}::{item['headline_hash']}"
        if key not in seen:
            seen.add(key)
            combined.append(item)

    # --- yfinance per-ticker (ticker-specific news) ---
    for ticker in all_tickers:
        items = fetch_yfinance_for_ticker(ticker)
        for item in items:
            key = f"{item['ticker']}::{item['headline_hash']}"
            if key not in seen:
                seen.add(key)
                combined.append(item)

    logger.info("Total unique news items across all sources: %d", len(combined))
    return combined
