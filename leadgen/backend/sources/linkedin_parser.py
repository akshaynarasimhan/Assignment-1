"""
Parse LinkedIn profile information from DuckDuckGo search result snippets.

LinkedIn blocks direct scraping, so we use DDG search results as a proxy:
- snippet text often contains "Name · Title at Company"
- URL is the LinkedIn profile link

No login, no API — just snippet parsing.
"""

from __future__ import annotations
import re
import logging
from typing import Optional

from backend.title_filter import is_senior, classify_seniority, classify_function

logger = logging.getLogger(__name__)

# Patterns seen in DDG snippets for LinkedIn profile pages
# "John Smith · Chief Technology Officer at Acme Corp"
_SNIPPET_PATTERN_1 = re.compile(
    r"^(.+?)\s*[·•|]\s*(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[·•|]|$)",
    re.IGNORECASE,
)

# "John Smith - Chief Technology Officer - Acme Corp"
_SNIPPET_PATTERN_2 = re.compile(
    r"^(.+?)\s*[-–—]\s*(.+?)\s*[-–—]\s*(.+?)(?:\s*[-–—]|$)",
    re.IGNORECASE,
)

# Title tag pattern: "John Smith - Chief Technology Officer - LinkedIn"
_TITLE_PATTERN = re.compile(
    r"^(.+?)\s*[-–—]\s*(.+?)\s*[-–—]\s*(?:LinkedIn|.*)",
    re.IGNORECASE,
)


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip(" ·•|–—-")


def parse_linkedin_result(
    result: dict,
    company_hint: Optional[str] = None,
    country: str = "India",
) -> Optional[dict]:
    """
    Parse a single DDG search result dict {title, url, snippet}.
    Returns a lead dict or None.
    """
    url = result.get("url", "")
    if "linkedin.com/in/" not in url:
        return None

    page_title = _clean(result.get("title", ""))
    snippet = _clean(result.get("snippet", ""))

    name, title, company = None, None, None

    # Try snippet first (richer)
    for text in [snippet, page_title]:
        m = _SNIPPET_PATTERN_1.match(text)
        if m:
            name, title, company = m.group(1), m.group(2), m.group(3)
            break
        m = _SNIPPET_PATTERN_2.match(text)
        if m:
            name, title, company = m.group(1), m.group(2), m.group(3)
            break

    # Fallback: title tag "Name - Title - LinkedIn"
    if not name:
        m = _TITLE_PATTERN.match(page_title)
        if m:
            name = m.group(1)
            title = m.group(2)

    if not name or not title:
        return None

    name = _clean(name)
    title = _clean(title)
    company = _clean(company) if company else (company_hint or "")

    # Sanity: reject if name looks like garbage
    if len(name.split()) < 2 or len(name) > 60:
        return None

    # Remove "LinkedIn" / "LinkedIn India" artifacts from company field
    company = re.sub(r"\s*[-–—|]\s*LinkedIn.*", "", company, flags=re.IGNORECASE).strip()
    company = re.sub(r"^LinkedIn\s*(India|Global)?\s*[-–—|]?\s*", "", company, flags=re.IGNORECASE).strip()
    # If company field is still empty or looks like a DDG navigation artefact, use hint
    if not company or company.lower() in ("linkedin", "linkedin india", "linkedin global"):
        company = company_hint or "Unknown"

    # Title may embed "at Company" — extract it
    if not company or company == "Unknown":
        m = re.search(r"\bat\s+(.+)$", title, re.IGNORECASE)
        if m:
            company = m.group(1).strip()
            title = title[:m.start()].strip().rstrip(",—-•|")

    # Strip trailing "at Company" leftovers from title
    title = re.sub(r"\s+at\s+.*$", "", title, flags=re.IGNORECASE).strip()

    seniority = classify_seniority(title)
    if seniority is None:
        return None

    return {
        "name": name,
        "title": title,
        "company": company or company_hint or "Unknown",
        "country": country,
        "linkedin_url": url,
        "seniority": seniority,
        "function": classify_function(title),
        "source": "linkedin_ddg",
        "source_url": url,
        "confidence": 0.75,
    }


def parse_linkedin_results(
    results: list[dict],
    company_hint: Optional[str] = None,
    country: str = "India",
) -> list[dict]:
    leads = []
    seen_urls = set()
    for r in results:
        url = r.get("url", "")
        if url in seen_urls:
            continue
        lead = parse_linkedin_result(r, company_hint=company_hint, country=country)
        if lead:
            seen_urls.add(url)
            leads.append(lead)
    return leads
