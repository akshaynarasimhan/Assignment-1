from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def get_watchlist() -> list[dict]:
    client = get_client()
    result = client.table("watchlist").select("*").eq("is_active", True).execute()
    return result.data or []


def add_ticker(ticker: str, company_name: str = "") -> dict:
    client = get_client()
    result = (
        client.table("watchlist")
        .upsert(
            {"ticker": ticker.upper(), "company_name": company_name, "is_active": True},
            on_conflict="ticker",
        )
        .execute()
    )
    return result.data[0] if result.data else {}


def remove_ticker(ticker: str) -> bool:
    client = get_client()
    client.table("watchlist").update({"is_active": False}).eq("ticker", ticker.upper()).execute()
    return True


def delete_ticker(ticker: str) -> bool:
    client = get_client()
    client.table("watchlist").delete().eq("ticker", ticker.upper()).execute()
    return True


def is_news_processed(ticker: str, headline_hash: str) -> bool:
    client = get_client()
    result = (
        client.table("processed_news")
        .select("id")
        .eq("ticker", ticker)
        .eq("headline_hash", headline_hash)
        .limit(1)
        .execute()
    )
    return bool(result.data)


def save_processed_news(record: dict) -> dict:
    client = get_client()
    result = (
        client.table("processed_news")
        .upsert(record, on_conflict="ticker,headline_hash")
        .execute()
    )
    return result.data[0] if result.data else {}


def get_recent_signals(limit: int = 50) -> list[dict]:
    client = get_client()
    result = (
        client.table("processed_news")
        .select("*")
        .eq("is_ep_signal", True)
        .order("processed_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def get_all_recent_news(limit: int = 100) -> list[dict]:
    client = get_client()
    result = (
        client.table("processed_news")
        .select("*")
        .order("processed_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []
