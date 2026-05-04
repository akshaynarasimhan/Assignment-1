"""
Company website scraper.

Priority:
1. Try plain httpx GET first (fast, zero overhead).
2. If result looks JS-rendered (body too small or no useful text), fall back
   to Playwright headless Chrome.
3. Parse page for name/title pairs using heuristics.
"""

from __future__ import annotations
import re
import logging
import asyncio
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from backend.config import REQUEST_TIMEOUT, PLAYWRIGHT_TIMEOUT, USE_PLAYWRIGHT
from backend.title_filter import is_senior, classify_seniority, classify_function

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# Common leadership page path fragments
_LEADERSHIP_PATHS = [
    "/leadership", "/our-team", "/team", "/about/team", "/about/leadership",
    "/about-us/team", "/about-us/leadership", "/management", "/management-team",
    "/board", "/executive-team", "/executives", "/corporate-governance",
    "/company/team", "/company/leadership", "/people",
]

# Regex to detect JS-shell pages (React/Angular empty body)
_JS_SHELL_RE = re.compile(r"<div[^>]+id=['\"](?:root|app)['\"][^>]*>\s*</div>", re.IGNORECASE)


async def fetch_html_plain(url: str) -> Optional[str]:
    try:
        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
            headers=_HEADERS,
        ) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.text
    except Exception as e:
        logger.debug("Plain fetch failed for %s: %s", url, e)
        return None


async def fetch_html_playwright(url: str) -> Optional[str]:
    if not USE_PLAYWRIGHT:
        return None
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.set_extra_http_headers({"Accept-Language": "en-US,en;q=0.9"})
            await page.goto(url, timeout=PLAYWRIGHT_TIMEOUT, wait_until="networkidle")
            html = await page.content()
            await browser.close()
            return html
    except Exception as e:
        logger.warning("Playwright fetch failed for %s: %s", url, e)
        return None


def _is_js_shell(html: str) -> bool:
    """Heuristic: page text is suspiciously short or contains empty React root div."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    return len(text) < 300 or bool(_JS_SHELL_RE.search(html))


async def fetch_page(url: str) -> Optional[str]:
    """Fetch a URL, falling back to Playwright if page appears JS-rendered."""
    html = await fetch_html_plain(url)
    if html and not _is_js_shell(html):
        return html
    logger.info("Page looks JS-rendered, trying Playwright: %s", url)
    pw_html = await fetch_html_playwright(url)
    return pw_html or html  # return plain html even if partial


async def discover_leadership_url(domain: str) -> Optional[str]:
    """
    Try well-known leadership page paths on the given domain.
    Returns the first URL that loads with useful content.
    """
    base = domain if domain.startswith("http") else f"https://{domain}"
    for path in _LEADERSHIP_PATHS:
        url = urljoin(base, path)
        html = await fetch_html_plain(url)
        if html and not _is_js_shell(html) and len(html) > 1000:
            return url
        # try with playwright only for first few promising paths
    logger.info("Could not auto-discover leadership page for %s", domain)
    return None


# ─── Person extraction heuristics ────────────────────────────────────────────

_TITLE_SUFFIXES = re.compile(
    r"\b(CEO|CFO|CTO|COO|CMO|CHRO|CPO|CDO|CRO|CIO|CISO"
    r"|Chief[^,\n]{2,40}Officer"
    r"|Managing Director|President|Founder|Co-Founder"
    r"|SVP|EVP|Senior Vice President|Executive Vice President"
    r"|Head of[^,\n]{2,40}|General Counsel)\b",
    re.IGNORECASE,
)

_NAME_RE = re.compile(r"^[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$")


def _extract_from_soup(soup: BeautifulSoup, company: str, country: str) -> list[dict]:
    """
    Generic heuristic extraction from any HTML page.
    Looks for name + title pairs in common structural patterns.
    """
    leads = []
    seen = set()

    def _add(name: str, title: str, url: str = "") -> None:
        key = (name.strip().lower(), company.lower())
        if key in seen:
            return
        seniority = classify_seniority(title)
        if seniority is None:
            return
        seen.add(key)
        leads.append(
            {
                "name": name.strip(),
                "title": title.strip(),
                "company": company,
                "country": country,
                "seniority": seniority,
                "function": classify_function(title),
                "linkedin_url": url if "linkedin.com" in url else None,
                "source": "website",
            }
        )

    # Pattern A: elements with aria-label or data-title containing person info
    for el in soup.select("[data-title], [aria-label]"):
        text = el.get("data-title") or el.get("aria-label") or ""
        if _TITLE_SUFFIXES.search(text):
            name_el = el.select_one("h2, h3, h4, strong, .name")
            if name_el:
                _add(name_el.get_text(strip=True), text)

    # Pattern B: <h3> or <h4> followed by a <p> or <span> that looks like a title
    for heading in soup.select("h2, h3, h4"):
        name_text = heading.get_text(strip=True)
        if not _NAME_RE.match(name_text):
            continue
        # Look at next siblings for title
        for sibling in heading.next_siblings:
            if hasattr(sibling, "get_text"):
                sibling_text = sibling.get_text(strip=True)
                if sibling_text and _TITLE_SUFFIXES.search(sibling_text):
                    _add(name_text, sibling_text)
                    break
                if sibling_text and len(sibling_text) > 3:
                    break  # non-empty non-title text → stop looking

    # Pattern C: consecutive list items "Name — Title"
    for li in soup.select("li"):
        text = li.get_text(" ", strip=True)
        m = re.match(r"^([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s*[–—\-|]\s*(.+)$", text)
        if m and _TITLE_SUFFIXES.search(m.group(2)):
            _add(m.group(1), m.group(2))

    # Pattern D: JSON-LD structured data (schema.org/Person)
    import json
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(script.string or "{}")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") in ("Person", "employee"):
                    name = item.get("name", "")
                    title = item.get("jobTitle", "")
                    if name and title and is_senior(title):
                        _add(name, title)
        except Exception:
            pass

    # Pattern E: table rows with name/title columns
    for table in soup.select("table"):
        headers = [th.get_text(strip=True).lower() for th in table.select("th")]
        name_idx = next((i for i, h in enumerate(headers) if "name" in h), None)
        title_idx = next((i for i, h in enumerate(headers) if "title" in h or "position" in h or "role" in h), None)
        if name_idx is not None and title_idx is not None:
            for row in table.select("tr"):
                cells = row.select("td")
                if len(cells) > max(name_idx, title_idx):
                    _add(cells[name_idx].get_text(strip=True),
                         cells[title_idx].get_text(strip=True))

    return leads


async def scrape_company_website(
    company: str,
    domain: Optional[str] = None,
    leadership_url: Optional[str] = None,
    country: str = "India",
) -> list[dict]:
    """
    Main entry point. Returns list of lead dicts scraped from company website.
    """
    results: list[dict] = []
    urls_tried: set[str] = set()

    async def _scrape_url(url: str) -> list[dict]:
        if url in urls_tried:
            return []
        urls_tried.add(url)
        logger.info("Scraping %s", url)
        html = await fetch_page(url)
        if not html:
            return []
        soup = BeautifulSoup(html, "html.parser")
        leads = _extract_from_soup(soup, company, country)
        # Also follow any leadership sub-links found on this page
        if not leads and domain:
            for a in soup.select("a[href]"):
                href = a.get("href", "")
                full = urljoin(f"https://{domain}", href) if not href.startswith("http") else href
                if urlparse(full).netloc.endswith(domain.lstrip("www.")) and any(
                    seg in href.lower() for seg in ["team", "leadership", "management", "about", "people"]
                ):
                    if full not in urls_tried:
                        sub_html = await fetch_page(full)
                        if sub_html:
                            sub_soup = BeautifulSoup(sub_html, "html.parser")
                            leads += _extract_from_soup(sub_soup, company, country)
        return leads

    # 1. Explicit leadership URL
    if leadership_url:
        results += await _scrape_url(leadership_url)

    # 2. Auto-discover from domain
    if not results and domain:
        discovered = await discover_leadership_url(domain)
        if discovered:
            results += await _scrape_url(discovered)

    # 3. Try domain root with playwright
    if not results and domain:
        base = domain if domain.startswith("http") else f"https://{domain}"
        results += await _scrape_url(base)

    # Deduplicate by name
    seen = set()
    deduped = []
    for r in results:
        k = r["name"].lower()
        if k not in seen:
            seen.add(k)
            deduped.append(r)

    return deduped
