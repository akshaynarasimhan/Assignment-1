"""
Entrypoint for GitHub Actions (and manual one-shot runs).
1. Runs the full EP Signal Engine (fetch all sources → dedup → analyze → store).
2. Sends the morning digest email covering the last 24 hours.

Usage:
    python run_digest.py
"""

import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    logger.info("=" * 60)
    logger.info("EP Signal Engine — morning digest run")
    logger.info("=" * 60)

    # Step 1: Run the engine
    logger.info("Step 1/2: Running EP Signal Engine across all sources...")
    try:
        from engine import run_engine
        new_signals = run_engine()
        logger.info("Engine complete. %d new signals found this run.", len(new_signals))
    except Exception as exc:
        logger.error("Engine run failed: %s", exc, exc_info=True)
        sys.exit(1)

    # Step 2: Send morning digest (last 24h, always sends)
    logger.info("Step 2/2: Sending morning digest email...")
    try:
        from mailer import send_morning_digest
        success = send_morning_digest()
        if success:
            logger.info("Morning digest sent successfully.")
        else:
            logger.warning("Morning digest failed to send — check RESEND_API_KEY secret.")
            sys.exit(1)
    except Exception as exc:
        logger.error("Mailer failed: %s", exc, exc_info=True)
        sys.exit(1)

    logger.info("Done.")


if __name__ == "__main__":
    main()
