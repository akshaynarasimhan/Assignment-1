"""
DuckDuckGo HTML scraper — zero API key, zero cost.

Strategy:
  POST to https://html.duckduckgo.com/html/ with the query.
  Parse result snippets for name/title/company hints.
  Rate-limit to avoid 202 captcha responses.
"""

from __future__ import annotations
import time
import re
import logging
import asyncio
from typing import Optional
import httpx
from bs4 import BeautifulSoup

from backend.config import DDG_DELAY, REQUEST_TIMEOUT, MAX_RETRIES

logger = logging.getLogger(__name__)

_DDG_URL = "https://html.duckduckgo.com/html/"
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://duckduckgo.com/",
}

_last_request_time: float = 0.0


async def _rate_limit() -> None:
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < DDG_DELAY:
        await asyncio.sleep(DDG_DELAY - elapsed)
    _last_request_time = time.time()


async def search_ddg(query: str, max_results: int = 10) -> list[dict]:
    """
    Returns list of {title, url, snippet} dicts from DDG HTML results.
    """
    await _rate_limit()

    for attempt in range(MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(
                timeout=REQUEST_TIMEOUT,
                follow_redirects=True,
                headers=_HEADERS,
            ) as client:
                resp = await client.post(
                    _DDG_URL,
                    data={"q": query, "b": "", "kl": "in-en"},
                )
                resp.raise_for_status()
                return _parse_ddg_html(resp.text, max_results)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                wait = 2 ** (attempt + 2)
                logger.warning("DDG rate-limited, waiting %ds", wait)
                await asyncio.sleep(wait)
            else:
                raise
        except Exception as e:
            if attempt < MAX_RETRIES:
                await asyncio.sleep(2 ** attempt)
            else:
                logger.error("DDG search failed: %s", e)
                return []
    return []


def _parse_ddg_html(html: str, max_results: int) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for result in soup.select(".result__body")[:max_results]:
        title_el = result.select_one(".result__title a")
        snippet_el = result.select_one(".result__snippet")
        if not title_el:
            continue
        url = title_el.get("href", "")
        # DDG wraps URLs in redirect — extract real URL
        if "uddg=" in url:
            m = re.search(r"uddg=([^&]+)", url)
            if m:
                from urllib.parse import unquote
                url = unquote(m.group(1))
        results.append(
            {
                "title": title_el.get_text(strip=True),
                "url": url,
                "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
            }
        )
    return results


async def search_linkedin_people(
    company: str,
    country: str = "India",
    seniority_hint: Optional[str] = None,
    function_hint: Optional[str] = None,
) -> list[dict]:
    """
    Constructs targeted LinkedIn people searches via DuckDuckGo.
    seniority_hint is now the FULL title term (e.g. "Chief People Officer"),
    not a generic label — so function_hint is usually None.
    """
    parts = ["site:linkedin.com/in"]
    if company:
        parts.append(f'"{company}"')
    parts.append(f'"{country}"')
    if seniority_hint:
        parts.append(f'"{seniority_hint}"')
    if function_hint:
        parts.append(f'"{function_hint}"')
    query = " ".join(parts)
    logger.info("DDG LinkedIn query: %s", query)
    return await search_ddg(query, max_results=15)


async def search_linkedin_company_leaders(
    company: str,
    country: str = "India",
    extra_terms: str = "",
) -> list[dict]:
    """
    Searches for ALL senior titles at a company — broad OR query covering
    every C-Suite acronym plus MD, President, Founder, Head of.
    """
    title_or = (
        'CEO OR CFO OR CTO OR COO OR CMO OR CHRO OR CPO OR CDO OR CRO OR CIO OR CISO OR CLO '
        'OR "Chief People Officer" OR "Chief Revenue Officer" OR "Chief Technology Officer" '
        'OR "Chief Financial Officer" OR "Chief Marketing Officer" OR "Chief Human Resources Officer" '
        'OR "Managing Director" OR President OR Founder OR "Co-Founder" OR "Head of"'
    )
    query = (
        f'site:linkedin.com/in "{company}" '
        f'({title_or}) '
        f'"{country}" {extra_terms}'
    )
    logger.info("DDG company leaders query: %s", query)
    return await search_ddg(query, max_results=20)
