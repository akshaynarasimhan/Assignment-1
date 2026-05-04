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

_SENIORITY_SEARCH_TERMS = {
    "C-Suite": ["CEO", "CFO", "CTO", "COO", "CMO", "Chief Executive"],
    "President/MD": ["President", "Managing Director"],
    "SVP/EVP": ["SVP", "EVP", "Senior Vice President"],
    "Head-Level": ["Head of"],
    "Founder": ["Founder", "Co-Founder"],
}

_FUNCTION_SEARCH_TERMS = {
    "Sales & Revenue": ["Sales", "Revenue", "Business Development"],
    "Marketing & Brand": ["Marketing", "Brand"],
    "Technology & Engineering": ["Technology", "Engineering", "CTO"],
    "Finance & Accounting": ["Finance", "CFO"],
    "Human Resources & People": ["HR", "Human Resources", "People"],
    "Operations & Strategy": ["Operations", "Strategy", "COO"],
    "Product Management": ["Product"],
    "Supply Chain, Logistics & Procurement": ["Supply Chain", "Logistics"],
    "Analytics, Data & BI": ["Analytics", "Data", "BI"],
    "Legal & Compliance": ["Legal", "Compliance", "General Counsel"],
    "Customer Success & Support": ["Customer Success"],
    "Corporate Affairs & Communications": ["Corporate Affairs", "Communications"],
}


async def open_search(
    country: str = "India",
    seniority: Optional[str] = None,
    function: Optional[str] = None,
    max_results: int = 50,
) -> AsyncIterator[ProgressEvent]:

    seen_names: set[str] = set()
    total_found = 0

    seniority_terms = _SENIORITY_SEARCH_TERMS.get(seniority, list(_SENIORITY_SEARCH_TERMS.keys())) if seniority else [
        t for terms in _SENIORITY_SEARCH_TERMS.values() for t in terms
    ]
    function_terms = _FUNCTION_SEARCH_TERMS.get(function, [None]) if function else [None]

    queries_total = min(len(seniority_terms) * len(function_terms), 10)
    queries_done = 0

    for s_term in seniority_terms[:5]:
        for f_term in (function_terms[:2] if function_terms[0] else [None]):
            pct = 5 + int(85 * queries_done / max(queries_total, 1))
            yield ProgressEvent(
                type="progress",
                message=f"Searching: {s_term}{' + ' + f_term if f_term else ''} in {country}…",
                percent=pct,
            )

            try:
                ddg_results = await search_linkedin_people(
                    company="",
                    country=country,
                    seniority_hint=s_term,
                    function_hint=f_term,
                )
                leads = parse_linkedin_results(ddg_results, country=country)
            except Exception as e:
                yield ProgressEvent(type="error", message=f"Search error: {e}")
                leads = []

            # SerpAPI supplement
            if serpapi_source.is_available() and total_found < max_results:
                try:
                    serp_leads = await serpapi_source.open_search(
                        country=country,
                        seniority_hint=s_term,
                        function_hint=f_term,
                    )
                    leads += serp_leads
                except Exception as e:
                    yield ProgressEvent(type="error", message=f"SerpAPI error: {e}")

            for lead in leads:
                key = lead.get("name", "").lower()
                if not key or key in seen_names:
                    continue
                seen_names.add(key)
                total_found += 1
                yield ProgressEvent(type="result", data=lead)
                if total_found >= max_results:
                    break

            queries_done += 1
            if total_found >= max_results:
                break

        if total_found >= max_results:
            break

    yield ProgressEvent(type="progress", message="Saving to database…", percent=95)
    all_raw = []  # results already emitted as SSE, just save them
    # We'll save them from the API handler which collects SSE results

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
