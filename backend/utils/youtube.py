"""
YouTube Data Module for Kuat Systems Dashboard
Fetches Star Wars video IDs from YouTube Data API v3
with 24-hour caching to respect API quota limits
"""

import requests
import os
import json
from datetime import datetime, timedelta
from pathlib import Path

# Cache configuration
CACHE_FILE = Path(__file__).parent.parent / 'data' / 'youtube_cache.json'
CACHE_DURATION = timedelta(days=1)

# Category to search query mapping with duration preferences
CATEGORY_QUERIES = {
    'scenery': {
        'query': 'Star Wars scenery ambient',
        'duration': 'long'  # Ambient videos should be long
    },
    'battles': {
        'query': 'Star Wars lightsaber duel full',
        'duration': 'medium'  # Battle clips can be medium length
    },
    'music': {
        'query': 'Star Wars official soundtrack full',
        'duration': 'medium'  # Music tracks are typically medium
    },
    'lore': {
        'query': 'Star Wars lore explained history',
        'duration': 'long'  # Lore videos are typically longer
    }
}

# Fallback video IDs in case API fails or quota exceeded
# These are verified working embeddable Star Wars videos
FALLBACK_VIDEOS = {
    'scenery': [
        '1k59gXTWf-A',  # Star Wars ambient
        'fCUlgFKGF0c',  # Star Wars scenery
        'SjC5bezSaWU'   # Star Wars atmosphere
    ],
    'battles': [
        'ns_PrdukHuM',  # Anakin vs Obi-Wan
        '8Qn_spdM5Zg',  # Revenge of the Sith duel
        'r5h2dLMqbJA'   # Luke vs Darth Vader
    ],
    'music': [
        '_D0ZQPqeJkk',  # Imperial March
        '1gpXMGit4P8',  # Duel of the Fates
        'W1937VEYguI'   # Binary Sunset
    ],
    'lore': [
        'wEBiPGmTphY',  # Star Wars explained
        'XD9WWqdfzRs',  # Star Wars lore
        'BSqJBWvbFgY'   # Star Wars history
    ]
}


def _load_cache():
    """Load cached video IDs from file"""
    try:
        if CACHE_FILE.exists():
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading YouTube cache: {e}")
    return {}


def _save_cache(cache_data):
    """Save video IDs to cache file"""
    try:
        # Ensure data directory exists
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)
    except Exception as e:
        print(f"Error saving YouTube cache: {e}")


def _is_cache_valid(cache_data, category):
    """Check if cache for category is still valid (less than 24 hours old)"""
    if category not in cache_data:
        return False
    
    cache_entry = cache_data[category]
    if 'timestamp' not in cache_entry or 'video_ids' not in cache_entry:
        return False
    
    try:
        cache_time = datetime.fromisoformat(cache_entry['timestamp'])
        return datetime.now() - cache_time < CACHE_DURATION
    except Exception:
        return False


def _fetch_from_youtube_api(api_key, category):
    """Fetch video IDs from YouTube Data API v3"""
    category_config = CATEGORY_QUERIES.get(category)
    if not category_config:
        return None
    
    query = category_config['query']
    duration = category_config.get('duration', 'medium')
    
    url = 'https://www.googleapis.com/youtube/v3/search'
    params = {
        'part': 'snippet',
        'type': 'video',
        'q': query,
        'maxResults': 10,
        'key': api_key,
        'videoDuration': duration,
        'videoEmbeddable': 'true',  # Only embeddable videos
        'safeSearch': 'strict'
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            video_ids = []
            
            for item in data.get('items', []):
                video_id = item.get('id', {}).get('videoId')
                if video_id:
                    video_ids.append(video_id)
            
            return video_ids if video_ids else None
        else:
            print(f"YouTube API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"YouTube API request failed: {e}")
        return None


def get_youtube_videos(api_key, category):
    """
    Get YouTube video IDs for a category
    
    Uses 24-hour caching to minimize API calls and respect quota limits.
    Falls back to hardcoded video IDs if API fails.
    
    Args:
        api_key: YouTube Data API v3 key
        category: One of 'scenery', 'battles', 'music', 'lore'
    
    Returns:
        dict with 'success', 'data' (list of video IDs), and 'source' (cache/api/fallback)
    """
    # Validate category
    if category not in CATEGORY_QUERIES:
        return {
            'success': False,
            'error': f'Invalid category: {category}',
            'data': FALLBACK_VIDEOS.get('scenery', []),
            'source': 'fallback'
        }
    
    # Load cache
    cache_data = _load_cache()
    
    # Check if we have valid cached data
    if _is_cache_valid(cache_data, category):
        return {
            'success': True,
            'data': cache_data[category]['video_ids'],
            'source': 'cache'
        }
    
    # No valid cache - try to fetch from API
    if api_key and api_key != 'YOUR_YOUTUBE_API_KEY_HERE':
        video_ids = _fetch_from_youtube_api(api_key, category)
        
        if video_ids:
            # Update cache
            cache_data[category] = {
                'video_ids': video_ids,
                'timestamp': datetime.now().isoformat()
            }
            _save_cache(cache_data)
            
            return {
                'success': True,
                'data': video_ids,
                'source': 'api'
            }
    
    # API failed or no key - use fallback
    return {
        'success': True,
        'data': FALLBACK_VIDEOS.get(category, FALLBACK_VIDEOS['scenery']),
        'source': 'fallback'
    }


def get_all_categories():
    """Get list of available video categories"""
    return list(CATEGORY_QUERIES.keys())
