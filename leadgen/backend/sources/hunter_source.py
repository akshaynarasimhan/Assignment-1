"""
Hunter.io email enrichment — optional, only active when HUNTER_API_KEY is set.
Free tier: 25 searches/month.

Used to enrich already-found leads with email addresses.
"""

from __future__ import annotations
import logging
import httpx
from backend.config import HUNTER_API_KEY, REQUEST_TIMEOUT

logger = logging.getLogger(__name__)

_HUNTER_URL = "https://api.hunter.io/v2/domain-search"


def is_available() -> bool:
    return bool(HUNTER_API_KEY)


async def find_emails_for_domain(domain: str, max_results: int = 10) -> list[dict]:
    """
    Returns list of {first_name, last_name, email, position, linkedin_url}.
    """
    if not HUNTER_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(
                _HUNTER_URL,
                params={
                    "domain": domain,
                    "api_key": HUNTER_API_KEY,
                    "limit": max_results,
                    "seniority": "executive",
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error("Hunter.io request failed: %s", e)
        return []

    people = []
    for person in data.get("data", {}).get("emails", []):
        people.append(
            {
                "first_name": person.get("first_name", ""),
                "last_name": person.get("last_name", ""),
                "email": person.get("value", ""),
                "position": person.get("position", ""),
                "linkedin_url": person.get("linkedin", ""),
                "seniority": person.get("seniority", ""),
            }
        )
    return people


async def enrich_lead_email(name: str, domain: str) -> str | None:
    """Try to find a work email for a known name at a domain."""
    if not HUNTER_API_KEY:
        return None
    first, *rest = name.split()
    last = rest[-1] if rest else ""
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(
                "https://api.hunter.io/v2/email-finder",
                params={
                    "domain": domain,
                    "first_name": first,
                    "last_name": last,
                    "api_key": HUNTER_API_KEY,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", {}).get("email")
    except Exception as e:
        logger.debug("Hunter email finder failed: %s", e)
        return None
