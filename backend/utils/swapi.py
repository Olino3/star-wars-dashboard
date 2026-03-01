"""
SWAPI (Star Wars API) Data Fetcher
Fetches characters, planets, and starships from swapi.dev
Includes in-memory caching to reduce API calls
"""

import random
import time
import requests

# In-memory cache: { category: { "data": [...], "timestamp": float } }
_cache = {}
CACHE_TTL = 3600  # 1 hour cache


def _fetch_swapi_page(category, page=1):
    """Fetch a single page from SWAPI for a given category."""
    url = f"https://swapi.dev/api/{category}/?page={page}"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def _get_cached_items(category):
    """Return cached items if still valid, otherwise None."""
    if category in _cache:
        entry = _cache[category]
        if time.time() - entry["timestamp"] < CACHE_TTL:
            return entry["data"]
    return None


def _fetch_all_items(category):
    """Fetch all items for a category (pages through results) and cache them."""
    cached = _get_cached_items(category)
    if cached is not None:
        return cached

    items = []
    page = 1
    while True:
        data = _fetch_swapi_page(category, page)
        items.extend(data["results"])
        if data["next"] is None:
            break
        page += 1
        # Be polite to the API
        if page > 5:
            break

    _cache[category] = {"data": items, "timestamp": time.time()}
    return items


def _format_character(person):
    """Format a SWAPI person into an archives entry."""
    return {
        "category": "PERSONNEL",
        "name": person.get("name", "Unknown"),
        "details": [
            {"label": "Homeworld", "value": "Classified"},
            {"label": "Height", "value": f"{person.get('height', '?')} cm"},
            {"label": "Birth Year", "value": person.get("birth_year", "Unknown")},
            {"label": "Species", "value": "Classified"},
        ],
        "classification": _get_threat_level(person.get("name", "")),
    }


def _format_planet(planet):
    """Format a SWAPI planet into an archives entry."""
    return {
        "category": "PLANETARY DATA",
        "name": planet.get("name", "Unknown"),
        "details": [
            {"label": "Climate", "value": planet.get("climate", "Unknown").title()},
            {"label": "Terrain", "value": planet.get("terrain", "Unknown").title()},
            {"label": "Population", "value": _format_population(planet.get("population", "unknown"))},
            {"label": "Diameter", "value": f"{planet.get('diameter', '?')} km"},
        ],
        "classification": _get_planet_status(planet.get("climate", "")),
    }


def _format_starship(ship):
    """Format a SWAPI starship into an archives entry."""
    return {
        "category": "FLEET REGISTRY",
        "name": ship.get("name", "Unknown"),
        "details": [
            {"label": "Model", "value": ship.get("model", "Unknown")},
            {"label": "Manufacturer", "value": ship.get("manufacturer", "Unknown")},
            {"label": "Class", "value": ship.get("starship_class", "Unknown").title()},
            {"label": "Hyperdrive", "value": f"Class {ship.get('hyperdrive_rating', '?')}"},
        ],
        "classification": _get_ship_status(ship.get("starship_class", "")),
    }


def _get_threat_level(name):
    """Assign a classification based on character name (thematic fun)."""
    high_threat = ["darth", "vader", "palpatine", "maul", "dooku", "grievous", "kylo", "snoke"]
    for word in high_threat:
        if word in name.lower():
            return {"level": "HIGH THREAT", "status": "critical"}
    return {"level": "CATALOGUED", "status": "nominal"}


def _get_planet_status(climate):
    """Assign a status based on planet climate."""
    hostile = ["frozen", "frigid", "superheated", "hot", "murky", "arid"]
    for word in hostile:
        if word in climate.lower():
            return {"level": "HOSTILE ENVIRONMENT", "status": "degraded"}
    return {"level": "HABITABLE", "status": "optimal"}


def _get_ship_status(ship_class):
    """Assign a status based on ship class."""
    capital = ["star destroyer", "dreadnought", "battleship", "cruiser", "star dreadnought"]
    for word in capital:
        if word in ship_class.lower():
            return {"level": "CAPITAL CLASS", "status": "critical"}
    return {"level": "REGISTERED", "status": "nominal"}


def _format_population(pop_str):
    """Format population number with suffixes."""
    if pop_str == "unknown" or pop_str is None:
        return "Unknown"
    try:
        pop = int(pop_str)
        if pop >= 1_000_000_000:
            return f"{pop / 1_000_000_000:.1f}B"
        if pop >= 1_000_000:
            return f"{pop / 1_000_000:.1f}M"
        if pop >= 1_000:
            return f"{pop / 1_000:.1f}K"
        return str(pop)
    except (ValueError, TypeError):
        return pop_str


def get_archives_entry():
    """
    Get a random Star Wars archives entry.
    Cycles through characters, planets, and starships.
    Returns a formatted dict ready for the frontend.
    """
    categories = [
        ("people", _format_character),
        ("planets", _format_planet),
        ("starships", _format_starship),
    ]

    # Pick a random category
    category_name, formatter = random.choice(categories)

    try:
        items = _fetch_all_items(category_name)
        if not items:
            return _fallback_entry()

        # Pick a random item from the category
        item = random.choice(items)
        return formatter(item)

    except Exception as e:
        print(f"SWAPI fetch error: {e}")
        return _fallback_entry()


def _fallback_entry():
    """Return a fallback entry if SWAPI is unavailable."""
    return {
        "category": "FLEET REGISTRY",
        "name": "Imperial Star Destroyer",
        "details": [
            {"label": "Model", "value": "Imperial I-class"},
            {"label": "Manufacturer", "value": "Kuat Drive Yards"},
            {"label": "Class", "value": "Star Destroyer"},
            {"label": "Hyperdrive", "value": "Class 2.0"},
        ],
        "classification": {"level": "CAPITAL CLASS", "status": "critical"},
    }
