"""
Email delivery for EP Signal Engine.

Two modes:
  1. send_morning_digest()  — always sends at 8am IST with all signals from
                              the last 24 hours, grouped by sector/ticker.
  2. send_signal_email()    — on-demand email for a specific list of signals.
"""

import logging
from datetime import datetime, timezone, timedelta

import resend

from config import RESEND_API_KEY, ALERT_EMAIL
from db import get_signals_since, get_recent_signals

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Style constants
# ---------------------------------------------------------------------------

SCORE_STYLE = {
    "High":   {"color": "#dc2626", "bg": "#fef2f2", "border": "#dc2626"},
    "Medium": {"color": "#d97706", "bg": "#fffbeb", "border": "#d97706"},
    "Low":    {"color": "#2563eb", "bg": "#eff6ff", "border": "#2563eb"},
}

CATEGORY_LABELS = {
    "earnings_surprise": "Earnings Surprise",
    "fda_approval":      "FDA Action",
    "major_contract":    "Major Contract",
    "ceo_change":        "Leadership Change",
    "m_and_a":           "M&A Activity",
    "regulatory":        "Regulatory Action",
    "clinical_trial":    "Clinical Trial",
    "bankruptcy":        "Bankruptcy / Restructuring",
    "partnership":       "Major Partnership",
    "other":             "Other EP Signal",
    "noise":             "Noise",
}

SOURCE_ICONS = {
    "Economic Times": "ET",
    "ET Markets":     "ET",
    "ET Industry":    "ET",
    "ET Corporate":   "ET",
    "Moneycontrol":   "MC",
    "MC Latest":      "MC",
    "MC Business":    "MC",
    "MC Market Reports": "MC",
    "Yahoo Finance":  "YF",
    "Yahoo Finance Top": "YF",
    "Google News India": "GN",
}


def _score_badge(score: str) -> str:
    s = SCORE_STYLE.get(score, {"color": "#6b7280", "bg": "#f9fafb", "border": "#6b7280"})
    dot = "&#9679;"
    return (
        f'<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;'
        f'border-radius:9999px;background:{s["bg"]};color:{s["color"]};font-size:11px;'
        f'font-weight:700;border:1px solid {s["border"]};">'
        f'{dot} {score}</span>'
    )


def _source_tag(source: str) -> str:
    tag = SOURCE_ICONS.get(source, source[:2].upper() if source else "??")
    return (
        f'<span style="display:inline-block;padding:2px 7px;border-radius:4px;'
        f'background:#1e293b;color:#94a3b8;font-size:10px;font-weight:600;'
        f'letter-spacing:0.5px;">{tag}</span>'
    )


def _signal_row(s: dict) -> str:
    score = s.get("relevance_score") or "Low"
    category = CATEGORY_LABELS.get(s.get("signal_category", ""), "Other")
    published = (s.get("published_at") or s.get("processed_at") or "")[:10]
    ticker_bare = s["ticker"].replace(".NS", "").replace(".BO", "")
    source = s.get("source") or ""
    reasoning = s.get("ai_reasoning") or ""

    return f"""
<tr>
  <td style="padding:12px 14px;border-bottom:1px solid #1e293b;
             font-family:'JetBrains Mono',monospace;font-weight:800;
             color:#fbbf24;white-space:nowrap;font-size:13px;">{ticker_bare}</td>
  <td style="padding:12px 14px;border-bottom:1px solid #1e293b;
             color:#e2e8f0;line-height:1.55;font-size:13px;">
    {s['headline']}
    {"<br><span style='font-size:11px;color:#64748b;font-style:italic;'>"+reasoning+"</span>" if reasoning else ""}
  </td>
  <td style="padding:12px 14px;border-bottom:1px solid #1e293b;white-space:nowrap;">
    {_score_badge(score)}
  </td>
  <td style="padding:12px 14px;border-bottom:1px solid #1e293b;
             color:#94a3b8;font-size:12px;white-space:nowrap;">{category}</td>
  <td style="padding:12px 14px;border-bottom:1px solid #1e293b;white-space:nowrap;">
    {_source_tag(source)}
  </td>
  <td style="padding:12px 14px;border-bottom:1px solid #1e293b;
             color:#64748b;font-size:12px;white-space:nowrap;">{published}</td>
</tr>"""


def _no_signals_row() -> str:
    return """
<tr>
  <td colspan="6" style="padding:40px;text-align:center;color:#475569;font-size:14px;">
    No EP signals detected in the last 24 hours — markets are calm.
  </td>
</tr>"""


def _build_html(signals: list[dict], digest_date: str, is_morning: bool = False) -> str:
    high   = [s for s in signals if s.get("relevance_score") == "High"]
    medium = [s for s in signals if s.get("relevance_score") == "Medium"]
    low    = [s for s in signals if s.get("relevance_score") == "Low"]

    # Sort: High first, then Medium, then Low; within each group by ticker
    ordered = (
        sorted(high,   key=lambda x: x["ticker"]) +
        sorted(medium, key=lambda x: x["ticker"]) +
        sorted(low,    key=lambda x: x["ticker"])
    )

    rows_html = "".join(_signal_row(s) for s in ordered) if ordered else _no_signals_row()

    digest_label = "Morning Digest" if is_morning else "Signal Alert"
    sources_used = sorted({s.get("source", "") for s in signals if s.get("source")})
    sources_str  = " &bull; ".join(sources_used) if sources_used else "ET &bull; MC &bull; Yahoo"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>EP Signal {digest_label}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:36px 0;">
<tr><td align="center">
<table width="960" cellpadding="0" cellspacing="0"
       style="max-width:960px;width:100%;border-radius:12px;overflow:hidden;
              border:1px solid #1e293b;">

  <!-- ══ HEADER ══ -->
  <tr><td style="background:linear-gradient(135deg,#0f2a4a 0%,#0a0f1e 100%);
                  padding:32px 40px;border-bottom:2px solid #f59e0b;">
    <table width="100%"><tr>
      <td>
        <div style="font-size:10px;letter-spacing:3px;color:#f59e0b;
                     text-transform:uppercase;margin-bottom:6px;">
          Episodic Pivot Signal Engine
        </div>
        <div style="font-size:26px;font-weight:900;color:#f8fafc;
                     letter-spacing:-0.5px;">
          &#9889; EP {digest_label}
        </div>
        <div style="font-size:13px;color:#64748b;margin-top:5px;">
          {digest_date} &nbsp;&bull;&nbsp; Sources: {sources_str}
        </div>
      </td>
      <td align="right" style="vertical-align:top;">
        <div style="text-align:right;">
          <div style="font-size:48px;font-weight:900;color:#f59e0b;
                       line-height:1;">{len(signals)}</div>
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;
                       letter-spacing:1px;">Signals Found</div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- ══ SCORE SUMMARY BAR ══ -->
  <tr><td style="background:#111827;padding:16px 40px;
                  border-bottom:1px solid #1e293b;">
    <table><tr>
      <td style="padding-right:20px;">
        <span style="background:#fef2f2;color:#dc2626;padding:5px 14px;
                     border-radius:9999px;font-size:12px;font-weight:700;
                     border:1px solid #dc2626;">&#9679; {len(high)} High Impact</span>
      </td>
      <td style="padding-right:20px;">
        <span style="background:#fffbeb;color:#d97706;padding:5px 14px;
                     border-radius:9999px;font-size:12px;font-weight:700;
                     border:1px solid #d97706;">&#9679; {len(medium)} Medium</span>
      </td>
      <td style="padding-right:20px;">
        <span style="background:#eff6ff;color:#2563eb;padding:5px 14px;
                     border-radius:9999px;font-size:12px;font-weight:700;
                     border:1px solid #2563eb;">&#9679; {len(low)} Low</span>
      </td>
      <td>
        <span style="color:#475569;font-size:11px;">
          Watching 115 Indian NSE/BSE stocks
        </span>
      </td>
    </tr></table>
  </td></tr>

  <!-- ══ SIGNALS TABLE ══ -->
  <tr><td style="background:#0a0f1e;">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;">
      <thead>
        <tr style="background:#111827;">
          <th style="padding:11px 14px;text-align:left;color:#475569;font-size:10px;
                     text-transform:uppercase;letter-spacing:1px;white-space:nowrap;
                     border-bottom:1px solid #1e293b;">Ticker</th>
          <th style="padding:11px 14px;text-align:left;color:#475569;font-size:10px;
                     text-transform:uppercase;letter-spacing:1px;
                     border-bottom:1px solid #1e293b;">Headline &amp; AI Reasoning</th>
          <th style="padding:11px 14px;text-align:left;color:#475569;font-size:10px;
                     text-transform:uppercase;letter-spacing:1px;white-space:nowrap;
                     border-bottom:1px solid #1e293b;">Impact</th>
          <th style="padding:11px 14px;text-align:left;color:#475569;font-size:10px;
                     text-transform:uppercase;letter-spacing:1px;
                     border-bottom:1px solid #1e293b;">Category</th>
          <th style="padding:11px 14px;text-align:left;color:#475569;font-size:10px;
                     text-transform:uppercase;letter-spacing:1px;white-space:nowrap;
                     border-bottom:1px solid #1e293b;">Source</th>
          <th style="padding:11px 14px;text-align:left;color:#475569;font-size:10px;
                     text-transform:uppercase;letter-spacing:1px;white-space:nowrap;
                     border-bottom:1px solid #1e293b;">Date</th>
        </tr>
      </thead>
      <tbody>{rows_html}</tbody>
    </table>
  </td></tr>

  <!-- ══ FOOTER ══ -->
  <tr><td style="background:#060d18;padding:20px 40px;border-top:1px solid #1e293b;">
    <div style="font-size:11px;color:#334155;text-align:center;">
      EP Signal Engine &bull; Powered by Economic Times + Moneycontrol + Yahoo Finance + OpenAI
      &bull; Delivered daily at 8:00 AM IST
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Public send functions
# ---------------------------------------------------------------------------

def send_morning_digest() -> bool:
    """
    Send the daily 8am IST digest.
    Pulls ALL signals from the last 24 hours regardless of whether they're new.
    Always sends (even if empty — shows "markets are calm" message).
    """
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY not set. Cannot send email.")
        return False

    since = datetime.now(tz=timezone.utc) - timedelta(hours=24)
    signals = get_signals_since(since)

    resend.api_key = RESEND_API_KEY

    ist_now = datetime.now(tz=timezone.utc) + timedelta(hours=5, minutes=30)
    digest_date = ist_now.strftime("%A, %B %d, %Y — 8:00 AM IST")

    high_count = sum(1 for s in signals if s.get("relevance_score") == "High")
    if high_count > 0:
        subject = f"\U0001f6a8 {high_count} HIGH Impact EP Signal(s) — Morning Digest {ist_now.strftime('%d %b %Y')}"
    elif signals:
        subject = f"\u26a1 EP Morning Digest — {len(signals)} Signal(s) | {ist_now.strftime('%d %b %Y')}"
    else:
        subject = f"\U0001f4c5 EP Morning Digest — No Signals | {ist_now.strftime('%d %b %Y')}"

    html_body = _build_html(signals, digest_date, is_morning=True)

    try:
        params: resend.Emails.SendParams = {
            "from": "EP Signal Engine <onboarding@resend.dev>",
            "to": [ALERT_EMAIL],
            "subject": subject,
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logger.info("Morning digest sent. ID: %s | Signals: %d", response.get("id"), len(signals))
        return True
    except Exception as exc:
        logger.error("Failed to send morning digest: %s", exc)
        return False


def send_signal_email(signals: list[dict] | None = None) -> bool:
    """
    On-demand signal alert email (e.g. triggered by the dashboard or API).
    """
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY not set. Cannot send email.")
        return False

    if signals is None:
        signals = get_recent_signals(limit=50)

    if not signals:
        logger.info("No EP signals to report. Skipping email.")
        return False

    resend.api_key = RESEND_API_KEY

    ist_now = datetime.now(tz=timezone.utc) + timedelta(hours=5, minutes=30)
    digest_date = ist_now.strftime("%B %d, %Y at %I:%M %p IST")

    high_count = sum(1 for s in signals if s.get("relevance_score") == "High")
    subject_prefix = "\U0001f6a8 HIGH PRIORITY — " if high_count > 0 else "\u26a1 "
    subject = f"{subject_prefix}EP Signal Alert: {len(signals)} New Signal(s) Detected"

    html_body = _build_html(signals, digest_date, is_morning=False)

    try:
        params: resend.Emails.SendParams = {
            "from": "EP Signal Engine <onboarding@resend.dev>",
            "to": [ALERT_EMAIL],
            "subject": subject,
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logger.info("Signal alert email sent. ID: %s", response.get("id"))
        return True
    except Exception as exc:
        logger.error("Failed to send signal email: %s", exc)
        return False


if __name__ == "__main__":
    import logging as _logging
    _logging.basicConfig(level=_logging.INFO)
    success = send_morning_digest()
    print("Morning digest sent!" if success else "Failed or no signals.")
