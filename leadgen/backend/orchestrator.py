"""
Orchestrates all sources for each search type.
Yields ProgressEvent dicts for SSE streaming.
"""

from __future__ import annotations
import asyncio
import logging
from typing import AsyncIterator, Optional
from backend.models import Lead, ProgressEvent
from backend.database import upsert_lead, get_conn
from backend.title_filter import classify_seniority, classify_function
from backend.sources.ddg_search import (
    search_linkedin_company_leaders,
    search_linkedin_people,
)
from backend.sources.linkedin_parser import parse_linkedin_results
from backend.sources.website_scraper import scrape_company_website
from backend.sources import serpapi_source, hunter_source

logger = logging.getLogger(__name__)


def _make_lead(d: dict) -> Optional[Lead]:
    try:
        return Lead(
            name=d["name"],
            title=d["title"],
            company=d["company"],
            country=d.get("country", "India"),
            linkedin_url=d.get("linkedin_url"),
            email=d.get("email"),
            function=d.get("function") or classify_function(d["title"]),
            seniority=d.get("seniority") or classify_seniority(d["title"]),
            source=d.get("source", "unknown"),
            source_url=d.get("source_url"),
            confidence=d.get("confidence", 1.0),
        )
    except Exception as e:
        logger.warning("Failed to build lead from %s: %s", d, e)
        return None


async def _save_leads(leads_data: list[dict]) -> list[Lead]:
    saved = []
    conn = get_conn()
    try:
        for d in leads_data:
            lead = _make_lead(d)
            if lead and lead.seniority:
                lead.id = upsert_lead(lead, conn)
                saved.append(lead)
    finally:
        conn.close()
    return saved


# ─── Company Search ───────────────────────────────────────────────────────────

async def company_search(
    company_name: str,
    domain: Optional[str] = None,
    leadership_url: Optional[str] = None,
    country: str = "India",
    max_results: int = 100,
) -> AsyncIterator[ProgressEvent]:

    all_leads: list[dict] = []
    seen_names: set[str] = set()

    def _dedup(new_leads: list[dict]) -> list[dict]:
        out = []
        for l in new_leads:
            k = l.get("name", "").lower()
            if k and k not in seen_names:
                seen_names.add(k)
                out.append(l)
        return out

    # ── Source 1: Company website ─────────────────────────────────────────────
    yield ProgressEvent(type="progress", message=f"Scraping company website for {company_name}…", percent=5)
    try:
        website_leads = await scrape_company_website(
            company=company_name,
            domain=domain,
            leadership_url=leadership_url,
            country=country,
        )
        new = _dedup(website_leads)
        all_leads += new
        yield ProgressEvent(
            type="progress",
            message=f"Website scrape found {len(new)} senior leader(s)",
            percent=30,
        )
        for l in new:
            yield ProgressEvent(type="result", data=l)
    except Exception as e:
        yield ProgressEvent(type="error", message=f"Website scrape error: {e}")

    # ── Source 2: LinkedIn via DuckDuckGo ─────────────────────────────────────
    yield ProgressEvent(type="progress", message="Searching LinkedIn via DuckDuckGo…", percent=35)
    try:
        ddg_results = await search_linkedin_company_leaders(company_name, country)
        li_leads = parse_linkedin_results(ddg_results, company_hint=company_name, country=country)
        new = _dedup(li_leads)
        all_leads += new
        yield ProgressEvent(
            type="progress",
            message=f"LinkedIn/DDG found {len(new)} new leader(s)",
            percent=60,
        )
        for l in new:
            yield ProgressEvent(type="result", data=l)
    except Exception as e:
        yield ProgressEvent(type="error", message=f"LinkedIn/DDG search error: {e}")

    # ── Source 3: SerpAPI (optional) ─────────────────────────────────────────
    if serpapi_source.is_available():
        yield ProgressEvent(type="progress", message="Enriching via SerpAPI…", percent=65)
        try:
            serp_leads = await serpapi_source.search_company_leaders(company_name, country)
            new = _dedup(serp_leads)
            all_leads += new
            yield ProgressEvent(type="progress", message=f"SerpAPI found {len(new)} new leader(s)", percent=75)
            for l in new:
                yield ProgressEvent(type="result", data=l)
        except Exception as e:
            yield ProgressEvent(type="error", message=f"SerpAPI error: {e}")

    # ── Source 4: Hunter.io email enrichment (optional) ──────────────────────
    if hunter_source.is_available() and domain:
        yield ProgressEvent(type="progress", message="Fetching emails from Hunter.io…", percent=80)
        try:
            emails = await hunter_source.find_emails_for_domain(domain, max_results=20)
            for ep in emails:
                full_name = f"{ep['first_name']} {ep['last_name']}".strip()
                if not full_name or not ep.get("position"):
                    continue
                seniority = classify_seniority(ep["position"])
                if not seniority:
                    continue
                key = full_name.lower()
                if key not in seen_names:
                    seen_names.add(key)
                    lead_data = {
                        "name": full_name,
                        "title": ep["position"],
                        "company": company_name,
                        "country": country,
                        "email": ep.get("email"),
                        "linkedin_url": ep.get("linkedin_url"),
                        "seniority": seniority,
                        "function": classify_function(ep["position"]),
                        "source": "hunter",
                        "confidence": 0.9,
                    }
                    all_leads.append(lead_data)
                    yield ProgressEvent(type="result", data=lead_data)
        except Exception as e:
            yield ProgressEvent(type="error", message=f"Hunter.io error: {e}")

    # ── Persist to DB ─────────────────────────────────────────────────────────
    yield ProgressEvent(type="progress", message="Saving results to local database…", percent=90)
    saved = await _save_leads(all_leads)

    yield ProgressEvent(
        type="done",
        message=f"Complete. Found {len(saved)} senior leader(s) for {company_name}.",
        percent=100,
        data={"count": len(saved)},
    )


# ─── Open Search ──────────────────────────────────────────────────────────────
#
# Each cell = exact title keywords to use when (seniority, function) are BOTH
# selected.  When only seniority is selected, use the flat seniority list.
# When only function is selected, use the flat function list.
# When neither is selected, iterate over all cells.
#
# This eliminates the broken cross-product approach (CEO × HR = wrong).

_CSUITE_BY_FUNCTION: dict[str, list[str]] = {
    "Sales & Revenue":                          ["Chief Revenue Officer", "CRO", "Chief Sales Officer", "Chief Commercial Officer", "Chief Growth Officer"],
    "Marketing & Brand":                        ["Chief Marketing Officer", "CMO", "Chief Brand Officer", "Chief Digital Officer"],
    "Technology & Engineering":                 ["Chief Technology Officer", "CTO", "Chief Information Officer", "CIO", "Chief Digital Officer", "Chief AI Officer", "Chief Data Officer"],
    "Finance & Accounting":                     ["Chief Financial Officer", "CFO", "Chief Accounting Officer", "Chief Investment Officer"],
    "Human Resources & People":                 ["Chief Human Resources Officer", "CHRO", "Chief People Officer", "Chief Talent Officer", "Chief HR Officer"],
    "Operations & Strategy":                    ["Chief Operating Officer", "COO", "Chief Strategy Officer", "Chief Transformation Officer", "Chief of Staff"],
    "Product Management":                       ["Chief Product Officer", "CPO", "Chief Experience Officer"],
    "Supply Chain, Logistics & Procurement":    ["Chief Supply Chain Officer", "Chief Procurement Officer", "Chief Logistics Officer"],
    "Analytics, Data & BI":                     ["Chief Data Officer", "CDO", "Chief Analytics Officer", "Chief AI Officer", "Chief Insights Officer"],
    "Legal & Compliance":                       ["Chief Legal Officer", "CLO", "Chief Compliance Officer", "General Counsel", "Chief Risk Officer"],
    "Customer Success & Support":               ["Chief Customer Officer", "CCO", "Chief Experience Officer", "Chief Client Officer"],
    "Corporate Affairs & Communications":       ["Chief Communications Officer", "Chief Corporate Affairs Officer", "Chief Sustainability Officer", "Chief Public Affairs Officer"],
}

_PRESIDENT_MD_TERMS = ["President", "Managing Director", "MD"]

_SVP_EVP_BY_FUNCTION: dict[str, list[str]] = {
    "Sales & Revenue":                          ["SVP Sales", "EVP Sales", "SVP Revenue", "Senior Vice President Sales"],
    "Marketing & Brand":                        ["SVP Marketing", "EVP Marketing", "Senior Vice President Marketing"],
    "Technology & Engineering":                 ["SVP Engineering", "EVP Engineering", "SVP Technology", "Senior Vice President Technology"],
    "Finance & Accounting":                     ["SVP Finance", "EVP Finance", "Senior Vice President Finance"],
    "Human Resources & People":                 ["SVP HR", "EVP HR", "SVP People", "Senior Vice President Human Resources"],
    "Operations & Strategy":                    ["SVP Operations", "EVP Operations", "SVP Strategy", "Senior Vice President Operations"],
    "Product Management":                       ["SVP Product", "EVP Product", "Senior Vice President Product"],
    "Supply Chain, Logistics & Procurement":    ["SVP Supply Chain", "EVP Procurement", "Senior Vice President Logistics"],
    "Analytics, Data & BI":                     ["SVP Analytics", "EVP Data", "Senior Vice President Analytics"],
    "Legal & Compliance":                       ["SVP Legal", "EVP Legal", "SVP Compliance", "Senior Vice President Legal"],
    "Customer Success & Support":               ["SVP Customer Success", "EVP Customer Experience", "Senior Vice President Customer"],
    "Corporate Affairs & Communications":       ["SVP Communications", "EVP Corporate Affairs", "Senior Vice President Communications"],
}

_HEAD_BY_FUNCTION: dict[str, list[str]] = {
    "Sales & Revenue":                          ["Head of Sales", "Head of Revenue", "Head of Business Development", "Head of Commercial"],
    "Marketing & Brand":                        ["Head of Marketing", "Head of Brand", "Head of Digital Marketing", "Head of Growth"],
    "Technology & Engineering":                 ["Head of Engineering", "Head of Technology", "Head of IT", "Head of Infrastructure", "Head of Platform"],
    "Finance & Accounting":                     ["Head of Finance", "Head of Accounting", "Head of Treasury", "Head of Tax"],
    "Human Resources & People":                 ["Head of HR", "Head of Human Resources", "Head of People", "Head of Talent"],
    "Operations & Strategy":                    ["Head of Operations", "Head of Strategy", "Head of Transformation"],
    "Product Management":                       ["Head of Product", "Head of Product Management"],
    "Supply Chain, Logistics & Procurement":    ["Head of Supply Chain", "Head of Procurement", "Head of Logistics"],
    "Analytics, Data & BI":                     ["Head of Analytics", "Head of Data", "Head of Business Intelligence"],
    "Legal & Compliance":                       ["Head of Legal", "Head of Compliance", "General Counsel", "Head of Risk"],
    "Customer Success & Support":               ["Head of Customer Success", "Head of Customer Experience", "Head of Support"],
    "Corporate Affairs & Communications":       ["Head of Communications", "Head of Corporate Affairs", "Head of Public Relations"],
}

_FOUNDER_TERMS = ["Founder", "Co-Founder", "Owner"]

# Flat fallback lists when no function is selected
_ALL_CSUITE_TERMS    = [t for terms in _CSUITE_BY_FUNCTION.values() for t in terms]
_ALL_SVP_EVP_TERMS   = [t for terms in _SVP_EVP_BY_FUNCTION.values() for t in terms]
_ALL_HEAD_TERMS      = [t for terms in _HEAD_BY_FUNCTION.values() for t in terms]


def _build_query_batches(seniority: Optional[str], function: Optional[str]) -> list[tuple[str, str]]:
    """
    Returns list of (or_query_string, label) tuples.
    Each tuple becomes ONE DDG search using an OR expression like:
      CHRO OR "Chief People Officer" OR "Chief Talent Officer"
    Batching multiple title synonyms into one query gives far better DDG results
    than firing separate queries per term.
    Max ~5 terms per OR batch to avoid query truncation.
    """
    def _or(terms: list[str]) -> str:
        # Short acronyms quoted, multi-word titles unquoted for broader match
        parts = []
        for t in terms:
            parts.append(f'"{t}"' if len(t.split()) <= 2 else t)
        return " OR ".join(parts)

    def _batch(terms: list[str], size: int = 4) -> list[list[str]]:
        return [terms[i:i+size] for i in range(0, len(terms), size)]

    batches: list[tuple[str, str]] = []

    def _add_batches(terms: list[str], label: str):
        for chunk in _batch(terms, 4):
            batches.append((_or(chunk), label))

    # ── Both seniority AND function ───────────────────────────────────────────
    if seniority and function:
        if seniority == "C-Suite":
            _add_batches(_CSUITE_BY_FUNCTION.get(function, []), f"C-Suite · {function}")
        elif seniority == "President/MD":
            _add_batches(_PRESIDENT_MD_TERMS, f"President/MD · {function}")
        elif seniority == "SVP/EVP":
            _add_batches(_SVP_EVP_BY_FUNCTION.get(function, []), f"SVP/EVP · {function}")
        elif seniority == "Head-Level":
            _add_batches(_HEAD_BY_FUNCTION.get(function, []), f"Head-Level · {function}")
        elif seniority == "Founder":
            _add_batches(_FOUNDER_TERMS, f"Founder · {function}")
        return batches

    # ── Only seniority ────────────────────────────────────────────────────────
    if seniority and not function:
        if seniority == "C-Suite":
            # Group by function so each batch stays semantically coherent
            for fn, terms in _CSUITE_BY_FUNCTION.items():
                _add_batches(terms, f"C-Suite · {fn}")
        elif seniority == "President/MD":
            _add_batches(_PRESIDENT_MD_TERMS, "President/MD")
        elif seniority == "SVP/EVP":
            for fn, terms in _SVP_EVP_BY_FUNCTION.items():
                _add_batches(terms, f"SVP/EVP · {fn}")
        elif seniority == "Head-Level":
            for fn, terms in _HEAD_BY_FUNCTION.items():
                _add_batches(terms, f"Head · {fn}")
        elif seniority == "Founder":
            _add_batches(_FOUNDER_TERMS, "Founder")
        return batches

    # ── Only function ─────────────────────────────────────────────────────────
    if function and not seniority:
        _add_batches(_CSUITE_BY_FUNCTION.get(function, []), f"C-Suite · {function}")
        _add_batches(_SVP_EVP_BY_FUNCTION.get(function, []), f"SVP/EVP · {function}")
        _add_batches(_HEAD_BY_FUNCTION.get(function, []), f"Head · {function}")
        _add_batches(_PRESIDENT_MD_TERMS, f"President/MD · {function}")
        _add_batches(_FOUNDER_TERMS, f"Founder · {function}")
        return batches

    # ── No filter — broad sweep capped at ~20 batches ─────────────────────────
    for fn, terms in _CSUITE_BY_FUNCTION.items():
        batches.append((_or(terms[:4]), f"C-Suite · {fn}"))
    batches.append((_or(_PRESIDENT_MD_TERMS), "President/MD"))
    for fn, terms in _HEAD_BY_FUNCTION.items():
        batches.append((_or(terms[:3]), f"Head · {fn}"))
    batches.append((_or(_FOUNDER_TERMS), "Founder"))
    return batches


async def open_search(
    country: str = "India",
    seniority: Optional[str] = None,
    function: Optional[str] = None,
    max_results: int = 50,
) -> AsyncIterator[ProgressEvent]:

    seen_names: set[str] = set()
    total_found = 0

    all_batches = _build_query_batches(seniority, function)
    total_batches = len(all_batches)

    yield ProgressEvent(
        type="progress",
        message=f"Built {total_batches} search queries…",
        percent=2,
    )

    for q_idx, (or_query, label) in enumerate(all_batches):
        if total_found >= max_results:
            break

        pct = 5 + int(88 * q_idx / max(total_batches, 1))
        yield ProgressEvent(
            type="progress",
            message=f"[{q_idx+1}/{total_batches}] {label} in {country}…",
            percent=pct,
        )

        try:
            ddg_results = await search_linkedin_people(
                company="",
                country=country,
                seniority_hint=or_query,
                function_hint=None,
            )
            leads = parse_linkedin_results(ddg_results, country=country)
        except Exception as e:
            yield ProgressEvent(type="error", message=f"Search error [{label}]: {e}")
            leads = []

        # SerpAPI supplement
        if serpapi_source.is_available() and total_found < max_results:
            try:
                serp_leads = await serpapi_source.open_search(
                    country=country,
                    seniority_hint=or_query,
                    function_hint=None,
                )
                leads += serp_leads
            except Exception as e:
                yield ProgressEvent(type="error", message=f"SerpAPI error: {e}")

        batch_new = 0
        for lead in leads:
            key = lead.get("name", "").lower()
            if not key or key in seen_names:
                continue
            seen_names.add(key)
            total_found += 1
            batch_new += 1
            yield ProgressEvent(type="result", data=lead)
            if total_found >= max_results:
                break

        if batch_new > 0:
            yield ProgressEvent(
                type="progress",
                message=f"  → {batch_new} new leader(s) found",
                percent=pct,
            )

    yield ProgressEvent(
        type="done",
        message=f"Open search complete. Found {total_found} leader(s).",
        percent=100,
        data={"count": total_found},
    )


# ─── Bulk Search ──────────────────────────────────────────────────────────────

async def bulk_search(
    rows: list[dict],
) -> AsyncIterator[ProgressEvent]:
    total = len(rows)
    all_leads_collected: list[dict] = []

    for idx, row in enumerate(rows):
        company = row.get("company_name", "")
        domain = row.get("domain")
        leadership_url = row.get("leadership_url")

        pct = int(100 * idx / max(total, 1))
        yield ProgressEvent(
            type="progress",
            message=f"[{idx+1}/{total}] Processing: {company}",
            percent=pct,
            data={"row_index": idx, "company": company, "status": "processing"},
        )

        company_leads: list[dict] = []
        try:
            async for event in company_search(company, domain, leadership_url):
                if event.type == "result" and event.data:
                    company_leads.append(event.data)
                elif event.type == "error":
                    yield ProgressEvent(
                        type="error",
                        message=f"{company}: {event.message}",
                        data={"row_index": idx},
                    )
        except Exception as e:
            yield ProgressEvent(
                type="error",
                message=f"Failed to process {company}: {e}",
                data={"row_index": idx},
            )

        all_leads_collected += company_leads
        yield ProgressEvent(
            type="progress",
            message=f"[{idx+1}/{total}] {company} — {len(company_leads)} leader(s) found",
            percent=int(100 * (idx + 1) / max(total, 1)),
            data={"row_index": idx, "company": company, "status": "done", "count": len(company_leads)},
        )

    yield ProgressEvent(
        type="done",
        message=f"Bulk search complete. Processed {total} companies.",
        percent=100,
        data={"total_companies": total, "total_leads": len(all_leads_collected)},
    )
