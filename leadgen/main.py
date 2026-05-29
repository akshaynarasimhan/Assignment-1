"""
FastAPI application — single-file entry point.
Serves the frontend SPA and exposes all API endpoints.
"""

from __future__ import annotations
import json
import logging
import asyncio
from pathlib import Path
from typing import Optional, AsyncIterator

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import HTMLResponse, StreamingResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db, query_leads, delete_all_leads
from backend.models import Lead, OpenSearchRequest, CompanySearchRequest
from backend.orchestrator import company_search, open_search, bulk_search
from backend.export import leads_to_csv, leads_to_excel, parse_bulk_upload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# Init DB on startup
init_db()

app = FastAPI(title="Lead Generation Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_STATIC = Path(__file__).parent / "static"
_TEMPLATES = Path(__file__).parent / "templates"

# Mount static files (CSS, JS)
if _STATIC.exists():
    app.mount("/static", StaticFiles(directory=str(_STATIC)), name="static")


# ─── Frontend ─────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index():
    html_file = _TEMPLATES / "index.html"
    if not html_file.exists():
        return HTMLResponse("<h1>UI not found — place index.html in templates/</h1>", 404)
    return HTMLResponse(html_file.read_text(encoding="utf-8"))


# ─── SSE helpers ─────────────────────────────────────────────────────────────

def _sse_encode(event_type: str, data: dict) -> str:
    payload = json.dumps(data, default=str)
    return f"event: {event_type}\ndata: {payload}\n\n"


async def _stream_generator(
    gen: AsyncIterator,
    collected_leads: list,
) -> AsyncIterator[str]:
    try:
        async for event in gen:
            yield _sse_encode(event.type, event.dict())
            if event.type == "result" and event.data:
                collected_leads.append(event.data)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.exception("Streaming error")
        yield _sse_encode("error", {"type": "error", "message": str(e)})


# ─── Tab 1: Open Search ───────────────────────────────────────────────────────

@app.get("/api/search/open")
async def api_open_search(
    country: str = Query(default="India"),
    seniority: Optional[str] = Query(default=None),
    function: Optional[str] = Query(default=None),
    max_results: int = Query(default=50, ge=1, le=500),
):
    """SSE endpoint — streams ProgressEvent objects."""
    collected: list = []

    async def generator():
        async for chunk in _stream_generator(
            open_search(country=country, seniority=seniority, function=function, max_results=max_results),
            collected,
        ):
            yield chunk

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Tab 2: Company Search ───────────────────────────────────────────────────

@app.post("/api/search/company")
async def api_company_search(req: CompanySearchRequest):
    """SSE endpoint — streams ProgressEvent objects."""
    collected: list = []

    async def generator():
        async for chunk in _stream_generator(
            company_search(
                company_name=req.company_name,
                domain=req.domain,
                leadership_url=req.leadership_url,
                max_results=req.max_results,
            ),
            collected,
        ):
            yield chunk

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Tab 3: Bulk Upload ───────────────────────────────────────────────────────

@app.post("/api/search/bulk")
async def api_bulk_search(file: UploadFile = File(...)):
    """
    Accepts Excel or CSV with company list.
    Streams SSE ProgressEvent objects.
    """
    filename = file.filename or "upload.csv"
    content = await file.read()

    try:
        rows = parse_bulk_upload(content, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not rows:
        raise HTTPException(status_code=400, detail="No valid company rows found in file.")

    collected: list = []

    async def generator():
        yield _sse_encode("progress", {
            "type": "progress",
            "message": f"Parsed {len(rows)} companies from {filename}",
            "percent": 1,
        })
        async for chunk in _stream_generator(bulk_search(rows), collected):
            yield chunk

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Export endpoints ─────────────────────────────────────────────────────────

@app.get("/api/export/csv")
async def export_csv(
    company: Optional[str] = None,
    seniority: Optional[str] = None,
    function: Optional[str] = None,
    country: Optional[str] = None,
):
    leads = query_leads(country=country, seniority=seniority, function=function, company=company)
    if not leads:
        raise HTTPException(404, "No leads found matching filters.")
    csv_content = leads_to_csv(leads)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@app.get("/api/export/excel")
async def export_excel(
    company: Optional[str] = None,
    seniority: Optional[str] = None,
    function: Optional[str] = None,
    country: Optional[str] = None,
):
    leads = query_leads(country=country, seniority=seniority, function=function, company=company)
    if not leads:
        raise HTTPException(404, "No leads found matching filters.")
    try:
        xlsx = leads_to_excel(leads)
    except RuntimeError as e:
        raise HTTPException(500, str(e))
    return Response(
        content=xlsx,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=leads.xlsx"},
    )


# ─── Leads query endpoint ─────────────────────────────────────────────────────

@app.get("/api/leads")
async def get_leads(
    company: Optional[str] = None,
    seniority: Optional[str] = None,
    function: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = Query(default=500, ge=1, le=2000),
):
    leads = query_leads(
        country=country, seniority=seniority, function=function,
        company=company, limit=limit,
    )
    return {"leads": [l.dict() for l in leads], "count": len(leads)}


@app.delete("/api/leads")
async def clear_leads():
    count = delete_all_leads()
    return {"deleted": count}


# ─── Health / config info ─────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    from backend.config import (
        SERPAPI_KEY, HUNTER_API_KEY, PROXYCURL_API_KEY,
        OPENAI_API_KEY, USE_PLAYWRIGHT,
    )
    return {
        "status": "ok",
        "sources": {
            "website_scraper": "active",
            "ddg_linkedin": "active",
            "playwright": "enabled" if USE_PLAYWRIGHT else "disabled",
            "serpapi": "active" if SERPAPI_KEY else "not configured",
            "hunter_io": "active" if HUNTER_API_KEY else "not configured",
            "proxycurl": "active" if PROXYCURL_API_KEY else "not configured",
            "openai": "active" if OPENAI_API_KEY else "not configured",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
