"""
SerpAPI fallback source — only active when SERPAPI_KEY env var is set.
Free tier: 100 searches/month.
"""

from __future__ import annotations
import logging
from typing import Optional
import httpx

from backend.config import SERPAPI_KEY, REQUEST_TIMEOUT
from backend.title_filter import classify_seniority, classify_function
from backend.sources.linkedin_parser import parse_linkedin_results

logger = logging.getLogger(__name__)

_SERPAPI_URL = "https://serpapi.com/search.json"


def is_available() -> bool:
    return bool(SERPAPI_KEY)


async def search_company_leaders(
    company: str,
    country: str = "India",
    extra: str = "",
) -> list[dict]:
    if not SERPAPI_KEY:
        return []

    query = (
        f'site:linkedin.com/in "{company}" '
        f'(CEO OR CFO OR CTO OR "Managing Director" OR President OR Founder) '
        f'"{country}" {extra}'
    )
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(
                _SERPAPI_URL,
                params={"q": query, "api_key": SERPAPI_KEY, "num": 20},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error("SerpAPI request failed: %s", e)
        return []

    raw_results = [
        {
            "title": r.get("title", ""),
            "url": r.get("link", ""),
            "snippet": r.get("snippet", ""),
        }
        for r in data.get("organic_results", [])
    ]
    return parse_linkedin_results(raw_results, company_hint=company, country=country)


async def open_search(
    country: str,
    seniority_hint: Optional[str],
    function_hint: Optional[str],
    max_results: int = 50,
) -> list[dict]:
    if not SERPAPI_KEY:
        return []

    parts = [f'site:linkedin.com/in "{country}"']
    if seniority_hint:
        parts.append(f'"{seniority_hint}"')
    if function_hint:
        parts.append(f'"{function_hint}"')
    query = " ".join(parts)

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(
                _SERPAPI_URL,
                params={"q": query, "api_key": SERPAPI_KEY, "num": min(max_results, 100)},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error("SerpAPI open search failed: %s", e)
        return []

    raw_results = [
        {
            "title": r.get("title", ""),
            "url": r.get("link", ""),
            "snippet": r.get("snippet", ""),
        }
        for r in data.get("organic_results", [])
    ]
    return parse_linkedin_results(raw_results, country=country)
