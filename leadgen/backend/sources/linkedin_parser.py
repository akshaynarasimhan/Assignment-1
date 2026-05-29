"""
Parse LinkedIn profile information and business news snippets from DDG results.

Sources:
1. LinkedIn profile pages — snippet contains "Name · Title at Company"
2. Business news (ET, Mint, Business Standard) — headlines contain
   "Name appointed as Title at Company India"

No login, no API — snippet parsing only.
"""

from __future__ import annotations
import re
import logging
from typing import Optional

from backend.title_filter import is_senior, classify_seniority, classify_function

logger = logging.getLogger(__name__)

# ── LinkedIn snippet patterns ─────────────────────────────────────────────────
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

# ── News article patterns ─────────────────────────────────────────────────────
# Pattern A: "Priya Nair appointed as CHRO at HUL"
_NEWS_PAT_A = re.compile(
    r"([A-Z][a-z]+(?: [A-Z]\.?)?(?: [A-Z][a-z]+){1,3})\s+"
    r"(?:appointed|named|joins?|promoted|elevated|takes? over|designated|hired)\s+"
    r"(?:as|to)?\s*(?:new\s+)?([A-Za-z &/,\-]+?)\s+(?:at|of|for|@)\s+([A-Za-z0-9 &.,\-]+?)(?:\.|,|;|\s*–|\s*$)",
    re.IGNORECASE,
)

# Pattern B: "HUL names/appoints Priya Nair as new CHRO"
_NEWS_PAT_B = re.compile(
    r"([A-Za-z0-9 &.,\-]+?)\s+(?:names?|appoints?|promotes?|elevates?|hires?)\s+"
    r"([A-Z][a-z]+(?: [A-Z]\.?)?(?: [A-Z][a-z]+){1,3})\s+"
    r"(?:as|to)?\s*(?:new\s+)?([A-Za-z &/,\-]+?)(?:\.|,|;|\s*–|\s*$)",
    re.IGNORECASE,
)

# Pattern C: LinkedIn title tag "Name - Title - Company | LinkedIn"
# (already handled by _TITLE_PATTERN above but also used in news context)

# Pattern D: snippet "Name: From CFO to Group CEO at Company"
_NEWS_PAT_D = re.compile(
    r"([A-Z][a-z]+(?: [A-Z]\.?)?(?: [A-Z][a-z]+){1,3}):\s*"
    r"(?:From\s+\S+\s+to\s+)?([A-Za-z &/,\-]+?)\s+(?:at|@)\s+([A-Za-z0-9 &.,\-]+?)(?:\s*[A-Z]|\.|,|;|$)",
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
    """
    Parse all DDG results — LinkedIn profiles AND business news articles.
    """
    leads = []
    seen_urls = set()
    seen_names: set[str] = set()

    for r in results:
        url = r.get("url", "")
        if url in seen_urls:
            continue
        seen_urls.add(url)

        if "linkedin.com/in/" in url:
            lead = parse_linkedin_result(r, company_hint=company_hint, country=country)
        else:
            lead = parse_news_result(r, company_hint=company_hint, country=country)

        if lead:
            name_key = lead["name"].lower()
            if name_key not in seen_names:
                seen_names.add(name_key)
                leads.append(lead)

    return leads


def parse_news_result(
    result: dict,
    company_hint: Optional[str] = None,
    country: str = "India",
) -> Optional[dict]:
    """
    Extract a lead from a business news article snippet/title.
    Tries multiple appointment announcement patterns.
    """
    url = result.get("url", "")
    page_title = _clean(result.get("title", ""))
    snippet = _clean(result.get("snippet", ""))

    # Skip ads and job board results
    ad_indicators = ["duckduckgo.com/y.js", "monster.com", "naukri.com",
                     "indeed.com", "glassdoor", "myperfectresume", "resume"]
    if any(ind in url.lower() for ind in ad_indicators):
        return None

    candidates: list[tuple[str, str, str]] = []  # (name, title, company)

    for text in [page_title, snippet]:
        # Pattern A: "Name appointed as Title at Company"
        m = _NEWS_PAT_A.search(text)
        if m:
            candidates.append((m.group(1), m.group(2), m.group(3)))

        # Pattern B: "Company names Name as Title"
        m = _NEWS_PAT_B.search(text)
        if m:
            # group(1)=company, group(2)=name, group(3)=title
            candidates.append((m.group(2), m.group(3), m.group(1)))

        # Pattern D: "Name: Title at Company"
        m = _NEWS_PAT_D.search(text)
        if m:
            candidates.append((m.group(1), m.group(2), m.group(3)))

    for name_raw, title_raw, company_raw in candidates:
        name = _clean(name_raw)
        title = _clean(title_raw)
        company = _clean(company_raw)

        # Remove trailing "as X" or "as Group X" leaked into name
        name = re.sub(r"\s+as\s+.*$", "", name, flags=re.IGNORECASE).strip()
        # Remove leading articles/prepositions from name
        name = re.sub(r"^(new|the|its|his|her)\s+", "", name, flags=re.IGNORECASE).strip()

        if len(name.split()) < 2 or len(name) > 50:
            continue
        # Reject if name contains lowercase-only words (likely a sentence fragment)
        words = name.split()
        if not all(w[0].isupper() for w in words if len(w) > 2):
            continue

        # Strip trailing preposition leftovers from title
        title = re.sub(r"\s+(at|of|for|with|@)\s+.*$", "", title, flags=re.IGNORECASE).strip()
        title = re.sub(r",.*$", "", title).strip()
        title = re.sub(r"\s{2,}", " ", title).strip()

        # Strip company noise
        company = re.sub(r"\s+(Ltd|Limited|Pvt|Private|Inc|Corp|Co\b)\.?$", "", company,
                         flags=re.IGNORECASE).strip()

        seniority = classify_seniority(title)
        if not seniority:
            continue

        return {
            "name": name,
            "title": title,
            "company": company or company_hint or "Unknown",
            "country": country,
            "linkedin_url": None,
            "seniority": seniority,
            "function": classify_function(title),
            "source": "news_ddg",
            "source_url": url,
            "confidence": 0.65,
        }

    return None
