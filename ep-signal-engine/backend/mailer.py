"""
Email delivery for EP Signal Engine — sends a professional HTML digest
of all high-confidence Episodic Pivot signals via the Resend API.
"""

import logging
from datetime import datetime, timezone

import resend

from config import RESEND_API_KEY, ALERT_EMAIL
from db import get_recent_signals

logger = logging.getLogger(__name__)

SCORE_COLORS = {
    "High": ("#dc2626", "#fef2f2"),    # red
    "Medium": ("#d97706", "#fffbeb"),  # amber
    "Low": ("#2563eb", "#eff6ff"),     # blue
}

CATEGORY_LABELS = {
    "earnings_surprise": "Earnings Surprise",
    "fda_approval": "FDA Action",
    "major_contract": "Major Contract",
    "ceo_change": "Leadership Change",
    "m_and_a": "M&A Activity",
    "regulatory": "Regulatory Action",
    "clinical_trial": "Clinical Trial",
    "bankruptcy": "Bankruptcy / Restructuring",
    "partnership": "Major Partnership",
    "other": "Other EP Signal",
}


def _build_html(signals: list[dict]) -> str:
    now_str = datetime.now(tz=timezone.utc).strftime("%B %d, %Y at %H:%M UTC")

    rows_html = ""
    for s in signals:
        score = s.get("relevance_score") or "Low"
        border_color, bg_color = SCORE_COLORS.get(score, ("#6b7280", "#f9fafb"))
        category = CATEGORY_LABELS.get(s.get("signal_category", ""), "Other")
        published = s.get("published_at", "")[:10] if s.get("published_at") else "—"

        rows_html += f"""
        <tr>
          <td style="padding:14px 16px; border-bottom:1px solid #1e293b; font-weight:700;
                     color:#f8fafc; white-space:nowrap;">{s['ticker']}</td>
          <td style="padding:14px 16px; border-bottom:1px solid #1e293b; color:#e2e8f0;
                     line-height:1.5;">{s['headline']}</td>
          <td style="padding:14px 16px; border-bottom:1px solid #1e293b; white-space:nowrap;">
            <span style="display:inline-block; padding:3px 10px; border-radius:9999px;
                         background:{bg_color}; color:{border_color}; font-size:12px;
                         font-weight:700; border:1px solid {border_color};">{score}</span>
          </td>
          <td style="padding:14px 16px; border-bottom:1px solid #1e293b; color:#94a3b8;
                     font-size:13px; white-space:nowrap;">{category}</td>
          <td style="padding:14px 16px; border-bottom:1px solid #1e293b; color:#64748b;
                     font-size:12px; white-space:nowrap;">{published}</td>
          <td style="padding:14px 16px; border-bottom:1px solid #1e293b; color:#94a3b8;
                     font-size:12px; font-style:italic;">{s.get('ai_reasoning', '')}</td>
        </tr>"""

    high_count = sum(1 for s in signals if s.get("relevance_score") == "High")
    med_count = sum(1 for s in signals if s.get("relevance_score") == "Medium")
    low_count = sum(1 for s in signals if s.get("relevance_score") == "Low")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>EP Signal Digest</title>
</head>
<body style="margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a; padding:40px 0;">
    <tr><td align="center">
      <table width="900" cellpadding="0" cellspacing="0" style="max-width:900px; width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#0f172a);
                        border-radius:12px 12px 0 0; padding:36px 40px;
                        border-bottom:2px solid #f59e0b;">
          <table width="100%"><tr>
            <td>
              <div style="font-size:11px; letter-spacing:3px; color:#f59e0b;
                           text-transform:uppercase; margin-bottom:8px;">Episodic Pivot Signal Engine</div>
              <div style="font-size:28px; font-weight:800; color:#f8fafc;">
                EP Signal Digest
              </div>
              <div style="font-size:14px; color:#94a3b8; margin-top:6px;">{now_str}</div>
            </td>
            <td align="right">
              <div style="font-size:40px; font-weight:900; color:#f59e0b;">{len(signals)}</div>
              <div style="font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">
                Signals Detected
              </div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Summary pills -->
        <tr><td style="background:#1e293b; padding:20px 40px; border-bottom:1px solid #334155;">
          <table><tr>
            <td style="padding-right:24px;">
              <span style="background:#fef2f2; color:#dc2626; padding:6px 16px; border-radius:9999px;
                           font-size:13px; font-weight:700; border:1px solid #dc2626;">
                &#9679; {high_count} High
              </span>
            </td>
            <td style="padding-right:24px;">
              <span style="background:#fffbeb; color:#d97706; padding:6px 16px; border-radius:9999px;
                           font-size:13px; font-weight:700; border:1px solid #d97706;">
                &#9679; {med_count} Medium
              </span>
            </td>
            <td>
              <span style="background:#eff6ff; color:#2563eb; padding:6px 16px; border-radius:9999px;
                           font-size:13px; font-weight:700; border:1px solid #2563eb;">
                &#9679; {low_count} Low
              </span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Table -->
        <tr><td style="background:#0f172a; border-radius:0 0 12px 12px; overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr style="background:#1e293b;">
                <th style="padding:12px 16px; text-align:left; color:#64748b; font-size:11px;
                           text-transform:uppercase; letter-spacing:1px; white-space:nowrap;">Ticker</th>
                <th style="padding:12px 16px; text-align:left; color:#64748b; font-size:11px;
                           text-transform:uppercase; letter-spacing:1px;">Headline</th>
                <th style="padding:12px 16px; text-align:left; color:#64748b; font-size:11px;
                           text-transform:uppercase; letter-spacing:1px;">Score</th>
                <th style="padding:12px 16px; text-align:left; color:#64748b; font-size:11px;
                           text-transform:uppercase; letter-spacing:1px;">Category</th>
                <th style="padding:12px 16px; text-align:left; color:#64748b; font-size:11px;
                           text-transform:uppercase; letter-spacing:1px;">Date</th>
                <th style="padding:12px 16px; text-align:left; color:#64748b; font-size:11px;
                           text-transform:uppercase; letter-spacing:1px;">AI Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {rows_html}
            </tbody>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px; text-align:center;">
          <div style="font-size:12px; color:#475569;">
            Generated by EP Signal Engine &bull; Powered by yfinance + OpenAI &bull;
            <a href="#" style="color:#f59e0b; text-decoration:none;">Manage Watchlist</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_signal_email(signals: list[dict] | None = None) -> bool:
    """
    Send the EP signal digest email.
    If `signals` is None, fetches the 50 most recent signals from the database.
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
    html_body = _build_html(signals)

    high_count = sum(1 for s in signals if s.get("relevance_score") == "High")
    subject_urgency = "🚨 HIGH PRIORITY — " if high_count > 0 else ""
    subject = f"{subject_urgency}EP Signal Digest: {len(signals)} New Signal(s) Detected"

    try:
        params: resend.Emails.SendParams = {
            "from": "EP Signal Engine <onboarding@resend.dev>",
            "to": [ALERT_EMAIL],
            "subject": subject,
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logger.info("Email sent successfully. ID: %s", response.get("id"))
        return True
    except Exception as exc:
        logger.error("Failed to send email: %s", exc)
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    success = send_signal_email()
    print("Email sent!" if success else "Email failed or no signals to send.")
