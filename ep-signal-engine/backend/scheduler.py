"""
Scheduler — two jobs:
  1. Continuous engine runs every 30 minutes (fetch + analyze + store).
  2. Daily 8:00 AM IST morning digest email (always sends, even if no new signals).

Run with:  python scheduler.py
"""

import logging
import sys

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import pytz

from engine import run_engine
from mailer import send_morning_digest, send_signal_email

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

IST = pytz.timezone("Asia/Kolkata")


def engine_job():
    """Run the full fetch-analyze-store pipeline. Does NOT send email."""
    logger.info("⚙  Engine job starting (30-min interval)...")
    try:
        signals = run_engine()
        logger.info("⚙  Engine job complete. %d new signals stored.", len(signals))
    except Exception as exc:
        logger.error("Engine job failed: %s", exc, exc_info=True)


def morning_digest_job():
    """
    8:00 AM IST daily digest.
    First runs the engine so the email includes the freshest possible news,
    then sends the morning digest covering the last 24 hours.
    """
    logger.info("📧  Morning digest job starting (8:00 AM IST)...")
    try:
        run_engine()          # Ensure latest news is processed
        success = send_morning_digest()
        if success:
            logger.info("📧  Morning digest sent successfully.")
        else:
            logger.warning("📧  Morning digest: send failed (check RESEND_API_KEY).")
    except Exception as exc:
        logger.error("Morning digest job failed: %s", exc, exc_info=True)


def main():
    scheduler = BlockingScheduler(timezone=IST)

    # --- Job 1: Engine runs every 30 minutes ---
    scheduler.add_job(
        engine_job,
        trigger=IntervalTrigger(minutes=30, timezone=IST),
        id="engine_30min",
        name="EP Signal Engine (30-min fetch+analyze)",
        max_instances=1,
        coalesce=True,
        misfire_grace_time=120,
    )

    # --- Job 2: Morning digest at 08:00 IST daily ---
    scheduler.add_job(
        morning_digest_job,
        trigger=CronTrigger(hour=8, minute=0, timezone=IST),
        id="morning_digest",
        name="Morning EP Signal Digest (8:00 AM IST)",
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300,
    )

    logger.info("=" * 60)
    logger.info("EP Signal Scheduler started.")
    logger.info("  • Engine: every 30 minutes")
    logger.info("  • Morning digest: 08:00 AM IST daily → %s", ALERT_EMAIL)
    logger.info("=" * 60)

    # Run engine immediately on startup
    logger.info("Running initial engine pass on startup...")
    engine_job()

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")
        sys.exit(0)


# Import ALERT_EMAIL for the startup log message
from config import ALERT_EMAIL  # noqa: E402

if __name__ == "__main__":
    main()
