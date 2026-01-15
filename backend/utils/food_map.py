"""
Food Map Utility
Fetches nearby food establishments using OpenStreetMap's Overpass API
"""

import requests
from typing import List, Dict, Optional


def get_nearby_food_places(
    latitude: float = 51.5074,  # Default: London
    longitude: float = -0.1278,
    radius: int = 1000  # Search radius in meters (1km default)
) -> List[Dict]:
    """
    Fetch nearby food establishments from OpenStreetMap

    Args:
        latitude: Center latitude for search
        longitude: Center longitude for search
        radius: Search radius in meters

    Returns:
        List of food places with name, type, and coordinates
    """

    # Overpass API endpoint
    overpass_url = "https://overpass-api.de/api/interpreter"

    # Overpass QL query to find food-related amenities
    # Searches for: restaurants, cafes, fast_food, food_court, ice_cream, etc.
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:{radius},{latitude},{longitude});
      node["amenity"="cafe"](around:{radius},{latitude},{longitude});
      node["amenity"="fast_food"](around:{radius},{latitude},{longitude});
      node["amenity"="food_court"](around:{radius},{latitude},{longitude});
      node["amenity"="ice_cream"](around:{radius},{latitude},{longitude});
      node["amenity"="pub"](around:{radius},{latitude},{longitude});
      node["amenity"="bar"](around:{radius},{latitude},{longitude});
      way["amenity"="restaurant"](around:{radius},{latitude},{longitude});
      way["amenity"="cafe"](around:{radius},{latitude},{longitude});
      way["amenity"="fast_food"](around:{radius},{latitude},{longitude});
    );
    out center 50;
    """

    try:
        response = requests.get(
            overpass_url,
            params={'data': overpass_query},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()

        food_places = []
        for element in data.get('elements', []):
            # Extract coordinates (handle both nodes and ways)
            if element['type'] == 'node':
                lat = element.get('lat')
                lon = element.get('lon')
            elif element['type'] == 'way' and 'center' in element:
                lat = element['center'].get('lat')
                lon = element['center'].get('lon')
            else:
                continue

            # Extract tags
            tags = element.get('tags', {})
            name = tags.get('name', 'Unnamed')
            amenity_type = tags.get('amenity', 'food')
            cuisine = tags.get('cuisine', '')

            # Create friendly type name
            type_map = {
                'restaurant': '🍽️ Restaurant',
                'cafe': '☕ Cafe',
                'fast_food': '🍔 Fast Food',
                'food_court': '🍱 Food Court',
                'ice_cream': '🍦 Ice Cream',
                'pub': '🍺 Pub',
                'bar': '🍹 Bar'
            }
            display_type = type_map.get(amenity_type, '🍴 Food')

            food_places.append({
                'id': element.get('id'),
                'name': name,
                'type': amenity_type,
                'display_type': display_type,
                'cuisine': cuisine,
                'latitude': lat,
                'longitude': lon,
                'address': tags.get('addr:street', ''),
                'distance': calculate_distance(latitude, longitude, lat, lon)
            })

        # Sort by distance (closest first)
        food_places.sort(key=lambda x: x['distance'])

        # Limit to 50 results
        return food_places[:50]

    except requests.exceptions.Timeout:
        return [{
            'error': 'Request timeout',
            'message': 'Overpass API request timed out'
        }]
    except requests.exceptions.RequestException as e:
        return [{
            'error': 'API error',
            'message': f'Failed to fetch food places: {str(e)}'
        }]
    except Exception as e:
        return [{
            'error': 'Unknown error',
            'message': f'Error processing food data: {str(e)}'
        }]


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate approximate distance between two coordinates in meters
    Uses simplified Haversine formula

    Args:
        lat1, lon1: First coordinate
        lat2, lon2: Second coordinate

    Returns:
        Distance in meters
    """
    from math import radians, cos, sin, sqrt, atan2

    R = 6371000  # Earth's radius in meters

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return round(distance, 2)


def get_user_location_from_ip() -> Optional[Dict[str, float]]:
    """
    Attempt to get user's approximate location from IP address
    Uses ip-api.com (free, no key required)

    Returns:
        Dict with latitude and longitude, or None if failed
    """
    try:
        response = requests.get('http://ip-api.com/json/', timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get('status') == 'success':
            return {
                'latitude': data.get('lat'),
                'longitude': data.get('lon'),
                'city': data.get('city'),
                'country': data.get('country')
            }
        return None
    except:
        return None
