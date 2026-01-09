"""
Youtini News Scraper
Fetches latest Star Wars book and comic articles from youtini.com
with caching, exponential backoff, and logging
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import logging
import time
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('youtini_scraper')

# Cache configuration
_cache = {
    'data': None,
    'timestamp': None,
    'ttl': 3300  # 55 minutes (aligns with hourly cron, leaves buffer)
}

# Request configuration
YOUTINI_URL = 'https://youtini.com/articles'
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
REQUEST_TIMEOUT = 10

# Exponential backoff configuration
MAX_RETRIES = 4
BACKOFF_DELAYS = [1, 2, 4, 8]  # seconds


def get_relative_time(date_str):
    """
    Convert date string (M/D/YY format) to relative time string.
    
    Args:
        date_str: Date in M/D/YY format (e.g., "1/7/26")
        
    Returns:
        Relative time string (e.g., "2 days ago", "1 week ago")
    """
    try:
        # Parse the date (handle 2-digit year)
        parsed_date = datetime.strptime(date_str.strip(), '%m/%d/%y')
        now = datetime.now()
        diff = now - parsed_date
        
        # Handle future dates (negative time difference)
        if diff.days < 0:
            logger.warning(f"Encountered future date {date_str}, treating as 'Just now'")
            return "Just now"
        
        if diff.days == 0:
            return "Today"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        elif diff.days < 14:
            return "1 week ago"
        elif diff.days < 30:
            weeks = diff.days // 7
            return f"{weeks} weeks ago"
        elif diff.days < 60:
            return "1 month ago"
        else:
            months = diff.days // 30
            return f"{months} months ago"
    except (ValueError, AttributeError) as e:
        logger.warning(f"Failed to parse date '{date_str}': {e}")
        return date_str


def fetch_with_backoff(url, headers):
    """
    Fetch URL with exponential backoff on retryable errors.
    
    Args:
        url: URL to fetch
        headers: Request headers
        
    Returns:
        Response object or None on failure
    """
    last_error = None
    
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            
            # Success
            if response.status_code == 200:
                logger.info(f"Successfully fetched {url} (attempt {attempt + 1})")
                return response
            
            # Rate limited - retry with backoff
            if response.status_code == 429:
                delay = BACKOFF_DELAYS[attempt] if attempt < len(BACKOFF_DELAYS) else BACKOFF_DELAYS[-1]
                logger.warning(f"Rate limited (429), retrying in {delay}s (attempt {attempt + 1}/{MAX_RETRIES})")
                time.sleep(delay)
                continue
            
            # Server error - retry with backoff
            if response.status_code >= 500:
                delay = BACKOFF_DELAYS[attempt] if attempt < len(BACKOFF_DELAYS) else BACKOFF_DELAYS[-1]
                logger.warning(f"Server error ({response.status_code}), retrying in {delay}s (attempt {attempt + 1}/{MAX_RETRIES})")
                time.sleep(delay)
                continue
            
            # Client error (403, 404, etc.) - don't retry
            logger.error(f"Client error ({response.status_code}) fetching {url}")
            return None
            
        except requests.exceptions.Timeout:
            delay = BACKOFF_DELAYS[attempt] if attempt < len(BACKOFF_DELAYS) else BACKOFF_DELAYS[-1]
            logger.warning(f"Request timeout, retrying in {delay}s (attempt {attempt + 1}/{MAX_RETRIES})")
            last_error = "Timeout"
            time.sleep(delay)
            
        except requests.exceptions.ConnectionError as e:
            delay = BACKOFF_DELAYS[attempt] if attempt < len(BACKOFF_DELAYS) else BACKOFF_DELAYS[-1]
            logger.warning(f"Connection error, retrying in {delay}s (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            last_error = str(e)
            time.sleep(delay)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request exception: {e}")
            last_error = str(e)
            break
    
    logger.error(f"All {MAX_RETRIES} retry attempts failed. Last error: {last_error}")
    return None


def parse_articles(html_content, limit=5):
    """
    Parse Youtini articles page HTML to extract article data.
    
    Args:
        html_content: Raw HTML string
        limit: Maximum number of articles to return
        
    Returns:
        List of article dictionaries
    """
    articles = []
    
    try:
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Find all article links - they follow pattern /article/ (relative or absolute)
        article_links = soup.find_all('a', href=re.compile(r'(/|\./)article/'))
        
        seen_urls = set()
        
        for link in article_links:
            if len(articles) >= limit:
                break
                
            href = link.get('href', '')
            
            # Normalize URL - convert relative to absolute
            if href.startswith('./'):
                url = 'https://youtini.com' + href[1:]  # Remove leading dot
            elif href.startswith('/'):
                url = 'https://youtini.com' + href
            else:
                url = href
            
            # Skip duplicates (each article appears multiple times in the page)
            if url in seen_urls:
                continue
            
            # Look for clean title in <p> tag (avoids title+description concatenation)
            p_tag = link.find('p')
            if p_tag:
                title = p_tag.get_text(strip=True)
            else:
                title = link.get_text(strip=True)
            
            # Skip navigation/empty links and image-only links
            if not title or len(title) < 10:
                continue
            
            # Skip non-article titles (like author names, categories)
            if title.lower() in ['youtini', 'read more', 'view all']:
                continue
            
            # Prefer shorter/cleaner titles (skip links with description appended)
            # Clean titles are typically < 80 chars
            if len(title) > 80:
                continue
                
            seen_urls.add(url)
            
            # Try to find the date - look in parent/sibling elements
            date_text = None
            category = None
            
            # Navigate up to find the article container
            parent = link.parent
            for _ in range(8):  # Look up to 8 levels for date/category
                if parent is None:
                    break
                    
                # Look for date pattern in parent text
                if not date_text:
                    parent_text = parent.get_text()
                    date_match = re.search(r'\d{1,2}/\d{1,2}/\d{2}', parent_text)
                    if date_match:
                        date_text = date_match.group()
                    
                # Look for category link
                if not category:
                    cat_link = parent.find('a', href=re.compile(r'/tag/'))
                    if cat_link:
                        category = cat_link.get_text(strip=True)
                        
                parent = parent.parent
            
            # Convert date to relative time
            relative_time = get_relative_time(date_text) if date_text else "Recently"
            
            articles.append({
                'title': title,
                'source': category if category else 'Youtini',
                'time': relative_time,
                'url': url
            })
            
        logger.info(f"Successfully parsed {len(articles)} articles")
        return articles
        
    except Exception as e:
        logger.error(f"Failed to parse articles HTML: {e}")
        return []


def get_cached_articles():
    """
    Get articles from cache if available and not expired.
    
    Returns:
        Cached articles list or None if cache miss/expired
    """
    if _cache['data'] and _cache['timestamp']:
        age = (datetime.now() - _cache['timestamp']).total_seconds()
        if age < _cache['ttl']:
            logger.info(f"Returning cached articles (age: {int(age)}s)")
            return _cache['data']
    return None


def update_cache(articles):
    """Update the cache with new articles."""
    _cache['data'] = articles
    _cache['timestamp'] = datetime.now()
    logger.info(f"Cache updated with {len(articles)} articles")


def get_youtini_articles(limit=5, force_refresh=False):
    """
    Get the latest articles from Youtini.
    
    Uses caching with TTL and falls back to cached data on fetch failures.
    
    Args:
        limit: Maximum number of articles to return (default: 5)
        force_refresh: Skip cache and fetch fresh data
        
    Returns:
        List of article dictionaries with keys: title, source, time, url
    """
    # Check cache first (unless force refresh)
    if not force_refresh:
        cached = get_cached_articles()
        if cached:
            return cached[:limit]
    
    # Fetch fresh data
    headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    
    response = fetch_with_backoff(YOUTINI_URL, headers)
    
    if response:
        articles = parse_articles(response.text, limit=limit)
        
        if articles:
            update_cache(articles)
            return articles
        else:
            logger.warning("No articles parsed from response, checking cache fallback")
    else:
        logger.warning("Fetch failed, checking cache fallback")
    
    # Fallback to cached data (even if expired)
    if _cache['data']:
        logger.info("Returning stale cached articles as fallback")
        return _cache['data'][:limit]
    
    # Final fallback - return empty with error indication
    logger.error("No cached data available, returning empty list")
    return []


# For testing/debugging
if __name__ == '__main__':
    logging.getLogger('youtini_scraper').setLevel(logging.DEBUG)
    articles = get_youtini_articles(force_refresh=True)
    print(f"\nFetched {len(articles)} articles:\n")
    for i, article in enumerate(articles, 1):
        print(f"{i}. {article['title']}")
        print(f"   Source: {article['source']} | Time: {article['time']}")
        print(f"   URL: {article['url']}\n")
