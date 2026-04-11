"""
Scheduler — runs the EP Signal Engine on a cron-like schedule,
then sends an email digest when new signals are found.
"""

import logging
import schedule
import time

from engine import run_engine
from mailer import send_signal_email

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def job():
    logger.info("Scheduled EP Signal Engine run starting...")
    new_signals = run_engine()
    if new_signals:
        logger.info("%d new signals found — sending digest email.", len(new_signals))
        send_signal_email(signals=new_signals)
    else:
        logger.info("No new signals. No email sent.")


if __name__ == "__main__":
    logger.info("EP Signal Scheduler started. Runs every 30 minutes.")
    job()  # Run immediately on startup

    schedule.every(30).minutes.do(job)

    while True:
        schedule.run_pending()
        time.sleep(60)
