# EP Signal Engine

An **Episodic Pivot (EP) Signal Engine** for your stock watchlist. Automatically fetches news, detects high-impact catalysts using AI, deduplicates against prior runs, and delivers a professional email digest.

---

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  React Dashboard │ ←→ │  FastAPI Backend  │ ←→ │    Supabase DB   │
│  (Tailwind/dark) │    │   (api.py)        │    │ watchlist        │
└─────────────────┘    └──────────────────┘    │ processed_news   │
                               │                └──────────────────┘
                        ┌──────▼──────┐
                        │  EP Engine  │
                        │  (engine.py)│
                        └─────┬───────┘
                    ┌─────────┴──────────┐
              ┌─────▼─────┐       ┌──────▼──────┐
              │  yfinance  │       │  OpenAI     │
              │  fetcher   │       │  GPT-4o-mini│
              └───────────┘       └─────────────┘
                                        │
                                  ┌─────▼──────┐
                                  │   Resend   │
                                  │   Email    │
                                  └────────────┘
```

## Supabase Project

- **Project ID**: `dwmpjtjbijksgbfdgjij`
- **URL**: `https://dwmpjtjbijksgbfdgjij.supabase.co`
- **Tables**: `watchlist`, `processed_news`

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env
pip install -r requirements.txt
```

Required environment variables:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o-mini) |
| `RESEND_API_KEY` | Resend API key |
| `ALERT_EMAIL` | Email to send digests to |

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Set REACT_APP_API_URL to your backend URL
npm install
npm start
```

## Running

### Manual one-shot run

```bash
cd backend
python engine.py          # Fetch + analyze + store
python mailer.py          # Send email digest of stored signals
```

### API server (for the dashboard)

```bash
cd backend
uvicorn api:app --reload --port 8000
```

### Automatic scheduled runs (every 30 minutes)

```bash
cd backend
python scheduler.py
```

## EP Signal Detection

### Signals (triggers email alert)
- Earnings surprises with triple-digit YoY growth
- FDA approvals or rejections
- Major contract wins (>50% of revenue)
- CEO/CFO changes (surprise departures)
- Mergers & Acquisitions
- DOJ/SEC/FTC regulatory actions
- Clinical trial Phase 2/3 results
- Bankruptcy filings / debt restructuring
- Major Fortune 100 partnerships

### Noise (filtered out)
- Analyst price target changes
- Generic market commentary
- Technical indicator analysis
- "Stocks to watch" listicles

### Relevance Scoring
| Score | Criteria |
|---|---|
| **High** | Near-certain to cause >15% price move |
| **Medium** | Likely 5-15% move |
| **Low** | Small catalyst, limited impact expected |

## Deduplication

Each headline is hashed as `SHA-256(ticker::headline.lower())`. Before processing, the engine checks the `processed_news` table — if the hash already exists for that ticker, the item is skipped entirely.

## Dashboard Features

- **Dashboard tab**: Stats overview (total processed, signals by score), one-click engine trigger
- **EP Signals tab**: Filterable feed of all detected signals with score badges and AI reasoning
- **Watchlist tab**: Add/remove tickers with company names

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/watchlist` | List active tickers |
| `POST` | `/watchlist` | Add ticker |
| `DELETE` | `/watchlist/{ticker}` | Remove ticker |
| `GET` | `/signals` | List EP signals |
| `GET` | `/news` | List all processed news |
| `POST` | `/run` | Trigger engine run |
| `GET` | `/stats` | Summary statistics |
| `GET` | `/health` | Health check |
