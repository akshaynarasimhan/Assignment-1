"""
Pydantic models shared across the entire backend.
"""

from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class SeniorityLevel(str, Enum):
    C_SUITE = "C-Suite"
    PRESIDENT_MD = "President/MD"
    SVP_EVP = "SVP/EVP"
    HEAD_LEVEL = "Head-Level"
    FOUNDER = "Founder"


class BusinessFunction(str, Enum):
    SALES = "Sales & Revenue"
    MARKETING = "Marketing & Brand"
    TECHNOLOGY = "Technology & Engineering"
    FINANCE = "Finance & Accounting"
    HR = "Human Resources & People"
    OPERATIONS = "Operations & Strategy"
    PRODUCT = "Product Management"
    SUPPLY_CHAIN = "Supply Chain, Logistics & Procurement"
    ANALYTICS = "Analytics, Data & BI"
    LEGAL = "Legal & Compliance"
    CUSTOMER_SUCCESS = "Customer Success & Support"
    CORPORATE_AFFAIRS = "Corporate Affairs & Communications"


class Lead(BaseModel):
    id: Optional[int] = None
    name: str
    title: str
    company: str
    country: str = "India"
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    function: Optional[str] = None
    seniority: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

    class Config:
        use_enum_values = True


class OpenSearchRequest(BaseModel):
    country: str = "India"
    seniority: Optional[str] = None        # SeniorityLevel value or None=all
    function: Optional[str] = None         # BusinessFunction value or None=all
    max_results: int = Field(default=50, ge=1, le=500)


class CompanySearchRequest(BaseModel):
    company_name: str
    domain: Optional[str] = None
    leadership_url: Optional[str] = None
    max_results: int = Field(default=100, ge=1, le=500)


class BulkRow(BaseModel):
    company_name: str
    domain: Optional[str] = None
    leadership_url: Optional[str] = None


class ProgressEvent(BaseModel):
    type: str           # "progress" | "result" | "error" | "done"
    message: str = ""
    data: Optional[dict] = None
    percent: Optional[float] = None
