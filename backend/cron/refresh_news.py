#!/usr/bin/env python3
"""
Youtini News Cache Refresh Script
Run via cron to pre-warm the news cache hourly.

Crontab entry (add with `crontab -e`):
0 * * * * cd /path/to/star-wars-dashboard/backend && python3 cron/refresh_news.py >> logs/youtini.log 2>&1

Or with full path:
0 * * * * /path/to/star-wars-dashboard/venv/bin/python3 /path/to/star-wars-dashboard/backend/cron/refresh_news.py
"""

import sys
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.youtini import get_youtini_articles

# Configure logging with rotation
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, 'youtini_cron.log')
handler = RotatingFileHandler(
    log_file,
    maxBytes=1024 * 1024,  # 1 MB
    backupCount=5
)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

logger = logging.getLogger('youtini_cron')
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# Also log to stdout for cron output capture
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(console_handler)


def main():
    """Pre-warm the Youtini news cache."""
    logger.info("=" * 50)
    logger.info("Starting Youtini cache refresh")
    
    try:
        # Force refresh to bypass cache
        articles = get_youtini_articles(limit=5, force_refresh=True)
        
        if articles:
            logger.info(f"Successfully cached {len(articles)} articles:")
            for i, article in enumerate(articles, 1):
                logger.info(f"  {i}. {article['title'][:60]}...")
        else:
            logger.warning("No articles retrieved - cache may be stale")
            
    except Exception as e:
        logger.error(f"Cache refresh failed: {e}", exc_info=True)
        sys.exit(1)
    
    logger.info("Cache refresh completed")
    logger.info("=" * 50)


if __name__ == '__main__':
    main()
