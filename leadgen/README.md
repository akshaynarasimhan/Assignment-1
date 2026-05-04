# LeadGen Engine

A local lead generation engine for finding senior business leaders across companies in India. Zero recurring cost for basic usage — all data stored locally, no cloud deployment needed.

## Quick Start

### Windows
Double-click `start.bat`  
or run from Command Prompt:
```
cd leadgen
start.bat
```

### Linux / macOS
```bash
cd leadgen
bash start.sh
```

Then open **http://localhost:8000** in your browser.

---

## Setup Checklist — External Accounts & API Keys

### FREE — Required for baseline (zero cost, no keys)

| Source | What it does | Setup |
|--------|-------------|-------|
| **DuckDuckGo HTML** | LinkedIn discovery search | Nothing — works out of the box |
| **Company websites** | Scrape leadership pages | Nothing — works out of the box |
| **Playwright / Chromium** | Handle JS-rendered pages | Installed automatically by `start.bat` / `start.sh` |

### OPTIONAL — Paid APIs (off by default)

| Source | Free Tier | Paid Starts At | Get Key | Env Var |
|--------|-----------|----------------|---------|---------|
| **SerpAPI** | 100 searches/month | $50/month | [serpapi.com](https://serpapi.com) → Dashboard → API Key | `SERPAPI_KEY` |
| **Hunter.io** | 25 searches/month | $34/month | [hunter.io](https://hunter.io) → API | `HUNTER_API_KEY` |
| **Proxycurl** | None (paid only) | ~$0.01/credit | [nubela.co/proxycurl](https://nubela.co/proxycurl) | `PROXYCURL_API_KEY` |
| **OpenAI** (LLM fallback) | None (paid only) | ~$0.001/1K tokens | [platform.openai.com](https://platform.openai.com/api-keys) | `OPENAI_API_KEY` |

### OPTIONAL FREE — Local LLM (no cost, runs on your machine)

| Tool | What it does | Install |
|------|-------------|---------|
| **Ollama** | Free local LLM for ambiguous title classification | [ollama.com](https://ollama.com) → download → `ollama pull llama3.2:1b` |

### Where to put your keys

1. Copy `.env.example` → `.env`
2. Uncomment and fill in the keys you have
3. Restart the app

The app works with **zero keys** — paid sources are automatically skipped when keys are absent.

---

## Features

### Tab 1 — Open Search
- Search by: Country + Seniority + Business Function
- Live streaming results while search runs
- Export to CSV or Excel

### Tab 2 — Company Search
- Enter company name + optional domain/leadership URL
- Searches: company website → LinkedIn (via DuckDuckGo) → SerpAPI (if key set) → Hunter.io emails (if key set)
- Results grouped and deduplicated across all sources
- Export to CSV or Excel

### Tab 3 — Bulk Upload
- Upload Excel or CSV with list of companies
- Flexible column name matching (company, Company Name, org, firm, etc.)
- Live per-row progress table
- Export combined results

---

## Seniority Levels Detected

| Level | Examples |
|-------|---------|
| C-Suite | CEO, CFO, CTO, COO, CMO, CHRO, Chief X Officer |
| President/MD | President, Managing Director |
| SVP/EVP | Senior Vice President, Executive Vice President |
| Head-Level | Head of Sales, Head of Engineering, General Counsel |
| Founder | Founder, Co-Founder, Owner |

## 12 Business Functions

Sales & Revenue · Marketing & Brand · Technology & Engineering · Finance & Accounting · Human Resources & People · Operations & Strategy · Product Management · Supply Chain, Logistics & Procurement · Analytics, Data & BI · Legal & Compliance · Customer Success & Support · Corporate Affairs & Communications

---

## Architecture

```
leadgen/
├── main.py                  # FastAPI app, SSE streaming endpoints
├── requirements.txt
├── start.bat                # Windows one-click launcher
├── start.sh                 # Linux/macOS launcher
├── .env.example             # All config options documented
├── data/
│   └── leads.db             # SQLite local database (auto-created)
├── backend/
│   ├── config.py            # Centralised config from env vars
│   ├── models.py            # Pydantic data models
│   ├── title_filter.py      # Deterministic rule-based title classifier
│   ├── database.py          # SQLite CRUD layer
│   ├── orchestrator.py      # Coordinates all sources, emits SSE events
│   ├── export.py            # CSV + Excel export, bulk file parser
│   └── sources/
│       ├── ddg_search.py        # DuckDuckGo HTML scraper (free)
│       ├── website_scraper.py   # Company website scraper + Playwright fallback
│       ├── linkedin_parser.py   # LinkedIn snippet parser from DDG results
│       ├── serpapi_source.py    # SerpAPI fallback (optional)
│       └── hunter_source.py     # Hunter.io email enrichment (optional)
├── static/
│   ├── css/styles.css       # Dark UI styles
│   └── js/app.js            # Vanilla JS SPA
└── templates/
    └── index.html           # Single-page app shell
```

---

## Title Classifier — Design Notes

The classifier is **fully deterministic and rule-based** — no LLM required.

**Critical ordering**: include patterns are checked BEFORE exclude patterns.
This prevents "Managing Director" from being wrongly excluded because it contains "Director".

Order: C-Suite → President/MD → SVP/EVP → Head-Level → Founder → *(only then)* Exclusions

---

## Data Sources — Priority Order

1. **Company website** — free, no rate limits, highest quality for known companies
2. **LinkedIn via DuckDuckGo** — free, no API key, snippet-based parsing
3. **SerpAPI** — paid optional, higher quality Google results
4. **Hunter.io** — paid optional, email enrichment for found leads

---

## Limitations

- LinkedIn blocks direct scraping. Results come from DDG snippets only (name + title extracted from search result text).
- JS-rendered pages require Playwright (installed automatically). Without it, React/Angular leadership pages will return empty.
- DuckDuckGo rate-limits aggressive queries. The app adds 2-second delays between requests.
- Search quality depends on how much public information is indexed for each company.
