"""
SQLite local database layer.  No ORM — plain sqlite3 for zero extra deps.
"""

from __future__ import annotations
import sqlite3
import json
from pathlib import Path
from typing import Optional
from backend.config import DB_PATH
from backend.models import Lead

_DDL = """
CREATE TABLE IF NOT EXISTS leads (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    title           TEXT    NOT NULL,
    company         TEXT    NOT NULL,
    country         TEXT    DEFAULT 'India',
    linkedin_url    TEXT,
    email           TEXT,
    function        TEXT,
    seniority       TEXT,
    source          TEXT,
    source_url      TEXT,
    confidence      REAL    DEFAULT 1.0,
    created_at      TEXT    DEFAULT (datetime('now')),
    UNIQUE(name, company)
);

CREATE TABLE IF NOT EXISTS search_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT,      -- 'open' | 'company' | 'bulk'
    params      TEXT,      -- JSON
    started_at  TEXT DEFAULT (datetime('now')),
    finished_at TEXT,
    lead_count  INTEGER DEFAULT 0
);
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(_DDL)


def upsert_lead(lead: Lead, conn: Optional[sqlite3.Connection] = None) -> int:
    """Insert or ignore (UNIQUE on name+company). Returns row id."""
    close = conn is None
    if conn is None:
        conn = get_conn()
    try:
        cur = conn.execute(
            """
            INSERT OR IGNORE INTO leads
                (name, title, company, country, linkedin_url, email,
                 function, seniority, source, source_url, confidence)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                lead.name, lead.title, lead.company, lead.country,
                lead.linkedin_url, lead.email, lead.function, lead.seniority,
                lead.source, lead.source_url, lead.confidence,
            ),
        )
        conn.commit()
        if cur.lastrowid:
            return cur.lastrowid
        # row already existed — fetch its id
        row = conn.execute(
            "SELECT id FROM leads WHERE name=? AND company=?",
            (lead.name, lead.company),
        ).fetchone()
        return row["id"] if row else -1
    finally:
        if close:
            conn.close()


def query_leads(
    country: Optional[str] = None,
    seniority: Optional[str] = None,
    function: Optional[str] = None,
    company: Optional[str] = None,
    limit: int = 500,
) -> list[Lead]:
    clauses, params = [], []
    if country:
        clauses.append("country LIKE ?")
        params.append(f"%{country}%")
    if seniority:
        clauses.append("seniority = ?")
        params.append(seniority)
    if function:
        clauses.append("function = ?")
        params.append(function)
    if company:
        clauses.append("company LIKE ?")
        params.append(f"%{company}%")

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    sql = f"SELECT * FROM leads {where} ORDER BY id DESC LIMIT ?"
    params.append(limit)

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()

    return [Lead(**dict(r)) for r in rows]


def delete_all_leads() -> int:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM leads")
        conn.commit()
        return cur.rowcount


def start_session(session_type: str, params: dict) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO search_sessions (type, params) VALUES (?,?)",
            (session_type, json.dumps(params)),
        )
        conn.commit()
        return cur.lastrowid


def finish_session(session_id: int, lead_count: int) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE search_sessions SET finished_at=datetime('now'), lead_count=? WHERE id=?",
            (lead_count, session_id),
        )
        conn.commit()
