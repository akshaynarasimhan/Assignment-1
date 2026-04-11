"""
EP Signal Analyzer — uses OpenAI to classify news headlines as
Episodic Pivot signals or noise, and assigns a relevance score.
"""

import json
import logging
from openai import OpenAI
from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

_client: OpenAI | None = None

SYSTEM_PROMPT = """You are a senior quantitative analyst specializing in identifying Episodic Pivot (EP) signals — news events that cause a fundamental, lasting re-evaluation of a company's intrinsic value.

Your job: given a stock ticker and a news headline, determine if it is an EP signal or noise.

## EP SIGNAL criteria (must match at least one):
- Earnings surprise with triple-digit YoY revenue/EPS growth
- FDA approval or rejection of a key drug/device
- Major contract win representing >50% of annual revenue
- CEO/CFO replacement (especially surprise departures or activist pressure)
- Merger, acquisition, or being acquired
- Regulatory action (DOJ/SEC investigation, fine, ban)
- Product recall affecting core revenue
- Bankruptcy filing or debt restructuring
- Major partnership with a FAANG/Fortune 100 company
- Clinical trial result (Phase 2/3 success or failure)

## NOISE (filter out):
- Analyst price target changes or upgrades/downgrades alone
- Generic market commentary or macroeconomic opinion
- Technical indicator analysis (RSI, MACD, etc.)
- "Stock to watch" or "Top picks" listicles
- Minor product updates or feature releases
- Routine quarterly guidance reaffirmation

## Relevance scoring:
- High: Near-certain to cause a massive gap-up or gap-down (>15% move)
- Medium: Likely to cause significant move (5-15%)
- Low: Small catalyst, EP signal but limited price impact expected

Respond ONLY with valid JSON:
{
  "is_ep_signal": true | false,
  "relevance_score": "High" | "Medium" | "Low" | null,
  "signal_category": "earnings_surprise" | "fda_approval" | "major_contract" | "ceo_change" | "m_and_a" | "regulatory" | "clinical_trial" | "bankruptcy" | "partnership" | "noise" | "other",
  "reasoning": "one sentence explanation"
}
"""


def analyze_headline(ticker: str, headline: str) -> dict:
    """
    Returns a dict with keys:
      is_ep_signal, relevance_score, signal_category, ai_reasoning
    Falls back to a heuristic if OpenAI is unavailable.
    """
    if not OPENAI_API_KEY:
        return _heuristic_fallback(headline)

    global _client
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)

    user_message = f"Ticker: {ticker}\nHeadline: {headline}"

    try:
        response = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=200,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return {
            "is_ep_signal": bool(data.get("is_ep_signal", False)),
            "relevance_score": data.get("relevance_score") if data.get("is_ep_signal") else None,
            "signal_category": data.get("signal_category", "other"),
            "ai_reasoning": data.get("reasoning", ""),
        }
    except Exception as exc:
        logger.error("OpenAI analysis failed for '%s': %s", headline, exc)
        return _heuristic_fallback(headline)


# --- Heuristic fallback (no API key required) ---

_SIGNAL_KEYWORDS = [
    ("earnings surprise", "earnings_surprise", "Medium"),
    ("triple-digit", "earnings_surprise", "High"),
    ("beats earnings", "earnings_surprise", "Medium"),
    ("earnings beat", "earnings_surprise", "Medium"),
    ("fda approv", "fda_approval", "High"),
    ("fda reject", "fda_approval", "High"),
    ("fda denied", "fda_approval", "High"),
    ("breakthrough therapy", "fda_approval", "Medium"),
    ("merger", "m_and_a", "High"),
    ("acquisition", "m_and_a", "High"),
    ("acquires", "m_and_a", "High"),
    ("buyout", "m_and_a", "High"),
    ("going private", "m_and_a", "High"),
    ("ceo resign", "ceo_change", "Medium"),
    ("ceo depart", "ceo_change", "Medium"),
    ("new ceo", "ceo_change", "Medium"),
    ("cfo resign", "ceo_change", "Medium"),
    ("ceo steps down", "ceo_change", "Medium"),
    ("major contract", "major_contract", "High"),
    ("billion-dollar deal", "major_contract", "High"),
    ("billion contract", "major_contract", "High"),
    ("$1b deal", "major_contract", "High"),
    ("doj investigation", "regulatory", "High"),
    ("sec charges", "regulatory", "High"),
    ("sec investigation", "regulatory", "High"),
    ("ftc sues", "regulatory", "High"),
    ("bankruptcy", "bankruptcy", "High"),
    ("chapter 11", "bankruptcy", "High"),
    ("phase 3", "clinical_trial", "High"),
    ("phase 2", "clinical_trial", "Medium"),
    ("clinical trial", "clinical_trial", "Medium"),
    ("partnership with", "partnership", "Medium"),
    ("strategic partnership", "partnership", "Medium"),
]

_NOISE_KEYWORDS = [
    "price target",
    "outperform",
    "buy rating",
    "sell rating",
    "neutral rating",
    "overweight",
    "underweight",
    "analyst",
    "rsi",
    "macd",
    "moving average",
    "top stocks",
    "stocks to watch",
    "best stocks",
]


def _heuristic_fallback(headline: str) -> dict:
    lower = headline.lower()
    for noise in _NOISE_KEYWORDS:
        if noise in lower:
            return {
                "is_ep_signal": False,
                "relevance_score": None,
                "signal_category": "noise",
                "ai_reasoning": "Heuristic: matched noise keyword pattern.",
            }
    for keyword, category, score in _SIGNAL_KEYWORDS:
        if keyword in lower:
            return {
                "is_ep_signal": True,
                "relevance_score": score,
                "signal_category": category,
                "ai_reasoning": f"Heuristic: matched EP signal keyword '{keyword}'.",
            }
    return {
        "is_ep_signal": False,
        "relevance_score": None,
        "signal_category": "noise",
        "ai_reasoning": "Heuristic: no EP signal patterns detected.",
    }
