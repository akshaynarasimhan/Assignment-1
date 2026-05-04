"""
Deterministic, rule-based title classifier.

CRITICAL ORDERING:
1. Check INCLUDE patterns first (MD, Chief, Founder, General Counsel, etc.)
   → Early-exit on match to prevent "Managing Director" being caught by Director exclusion.
2. Only after include-check passes do we run exclusion patterns.
3. LLM is called only when neither include nor exclude fires for ambiguous titles.
"""

from __future__ import annotations
import re
from typing import Optional
from backend.models import SeniorityLevel, BusinessFunction


# ─── Include patterns (checked FIRST, in order) ──────────────────────────────

_CSUITE_PATTERNS = [
    r"\bchief\b.*\bofficer\b",          # Chief X Officer (any)
    r"\bceo\b",
    r"\bcfo\b",
    r"\bcto\b",
    r"\bcoo\b",
    r"\bcmo\b",
    r"\bchro\b",
    r"\bcpo\b",
    r"\bcdo\b",
    r"\bclo\b",
    r"\bcro\b",
    r"\bcio\b",
    r"\bciso\b",
]

_PRESIDENT_MD_PATTERNS = [
    r"\bpresident\b",
    r"\bmanaging director\b",
    r"\bmd\b",                          # standalone MD
]

_SVP_EVP_PATTERNS = [
    r"\bsvp\b",
    r"\bevp\b",
    r"\bsenior vice president\b",
    r"\bexecutive vice president\b",
]

_HEAD_PATTERNS = [
    r"\bhead of\b",
    r"\bhead,\b",                       # "Head, Finance"
    r"\bhead -\b",
    r"\bgeneral counsel\b",
]

_FOUNDER_PATTERNS = [
    r"\bfounder\b",
    r"\bco-founder\b",
    r"\bcofounder\b",
    r"\bowner\b",                       # owner of a company context
]

# ─── Exclusion patterns (checked ONLY if no include fired) ───────────────────

_EXCLUDE_PATTERNS = [
    r"\bvice president\b",              # plain VP (not SVP/EVP — those were caught above)
    r"\b\bvp\b",
    r"\bdirector\b",                    # plain director (MD already caught above)
    r"\bmanager\b",
    r"\bassociate\b",
    r"\bassistant\b",
    r"\bcoordinator\b",
    r"\banalyst\b",
    r"\bspecialist\b",
    r"\bintern\b",
    r"\btrainee\b",
    r"\bgraduate\b",
    r"\bconsultant\b",
    r"\bcontractor\b",
    r"\bfreelance\b",
]


def _compile(patterns: list[str]) -> list[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]


_C_RE = _compile(_CSUITE_PATTERNS)
_PMD_RE = _compile(_PRESIDENT_MD_PATTERNS)
_SE_RE = _compile(_SVP_EVP_PATTERNS)
_H_RE = _compile(_HEAD_PATTERNS)
_F_RE = _compile(_FOUNDER_PATTERNS)
_EX_RE = _compile(_EXCLUDE_PATTERNS)


def classify_seniority(title: str) -> Optional[str]:
    """
    Returns a SeniorityLevel value string, or None if the title is excluded/unknown.
    Never calls an LLM — pure regex.
    """
    t = title.strip()

    # ── INCLUDE checks (early-exit) ───────────────────────────────────────────
    for pat in _C_RE:
        if pat.search(t):
            return SeniorityLevel.C_SUITE.value

    # SVP/EVP BEFORE President/MD — "Senior Vice President" contains "president"
    for pat in _SE_RE:
        if pat.search(t):
            return SeniorityLevel.SVP_EVP.value

    for pat in _PMD_RE:
        if pat.search(t):
            return SeniorityLevel.PRESIDENT_MD.value

    for pat in _H_RE:
        if pat.search(t):
            return SeniorityLevel.HEAD_LEVEL.value

    for pat in _F_RE:
        if pat.search(t):
            return SeniorityLevel.FOUNDER.value

    # ── EXCLUSION check (only reaches here if no include fired) ──────────────
    for pat in _EX_RE:
        if pat.search(t):
            return None         # excluded — not senior enough

    # ── Ambiguous — neither clearly senior nor clearly excluded ──────────────
    return None


def is_senior(title: str) -> bool:
    return classify_seniority(title) is not None


# ─── Function classifier ─────────────────────────────────────────────────────

_FUNCTION_MAP: list[tuple[list[str], str]] = [
    (
        ["chief revenue", "sales", "revenue", "business development", "account",
         "commercial", "growth", "crm", "b2b", "channel partner"],
        BusinessFunction.SALES.value,
    ),
    (
        ["marketing", "brand", "communications", "pr ", "public relations",
         "content", "demand gen", "growth market", "digital market"],
        BusinessFunction.MARKETING.value,
    ),
    (
        ["technology", "engineering", "software", "it ", "information technology",
         "infrastructure", "devops", "cloud", "cyber", "data engineer",
         "platform", "architect", "cto", "cio", "ciso"],
        BusinessFunction.TECHNOLOGY.value,
    ),
    (
        ["finance", "financial", "accounting", "treasury", "cfo", "audit",
         "tax", "controller", "fiscal", "budget"],
        BusinessFunction.FINANCE.value,
    ),
    (
        ["human resource", "hr ", "people", "talent", "chro", "recruit",
         "culture", "workforce", "compensation", "benefit"],
        BusinessFunction.HR.value,
    ),
    (
        ["operations", "strategy", "coo", "transformation", "excellence",
         "process", "efficiency", "planning", "chief of staff"],
        BusinessFunction.OPERATIONS.value,
    ),
    (
        ["product", "cpo", "product management", "product owner"],
        BusinessFunction.PRODUCT.value,
    ),
    (
        ["supply chain", "logistics", "procurement", "sourcing", "warehouse",
         "inventory", "fulfillment", "distribution"],
        BusinessFunction.SUPPLY_CHAIN.value,
    ),
    (
        ["analytics", "data science", "business intelligence", "bi ", "insight",
         "cdo", "data strategy", "machine learning", "ai "],
        BusinessFunction.ANALYTICS.value,
    ),
    (
        ["legal", "counsel", "compliance", "regulatory", "clo", "attorney",
         "law", "governance", "risk"],
        BusinessFunction.LEGAL.value,
    ),
    (
        ["customer success", "customer experience", "client success",
         "customer support", "customer service", "cx ", "ccxo"],
        BusinessFunction.CUSTOMER_SUCCESS.value,
    ),
    (
        ["corporate affairs", "public affairs", "investor relation",
         "government relation", "csr", "sustainability", "communication"],
        BusinessFunction.CORPORATE_AFFAIRS.value,
    ),
]


def classify_function(title: str) -> str:
    """Map a job title to one of the 12 business functions. Falls back to Operations."""
    tl = title.lower()
    for keywords, func in _FUNCTION_MAP:
        for kw in keywords:
            if kw in tl:
                return func
    return BusinessFunction.OPERATIONS.value
