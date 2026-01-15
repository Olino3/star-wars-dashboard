"""
Kuat Systems Dashboard - Backend API Server
Flask-based API serving system stats, weather, and transit data
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
from utils.system_stats import get_system_stats
from utils.weather import get_weather_data, get_galactic_date
from utils.subway import get_subway_data
from utils.youtini import get_youtini_articles
from utils.youtube import get_youtube_videos, get_all_categories
from utils.food_map import get_nearby_food_places, get_user_location_from_ip

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Configuration
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
WEATHER_LOCATION = os.getenv('WEATHER_LOCATION', 'London')
SUBWAY_CITY = os.getenv('SUBWAY_CITY', 'NYC')
SUBWAY_STATION_ID = os.getenv('SUBWAY_STATION_ID', 'D17')
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', 'YOUR_YOUTUBE_API_KEY_HERE')

RSS_FEEDS = [
    "https://www.starwars.com/news",
    "https://starwarsblog.starwars.com/feed/",
]


@app.route('/')
def index():
    """Serve the main dashboard HTML"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/system')
def api_system():
    """Get system statistics (CPU, RAM, Disk, Temp)"""
    try:
        stats = get_system_stats()
        return jsonify({"success": True, "data": stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/weather')
def api_weather():
    """Get atmospheric data (weather)"""
    try:
        weather = get_weather_data(WEATHER_API_KEY, WEATHER_LOCATION)
        return jsonify({"success": True, "data": weather})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/chronometer')
def api_chronometer():
    """Get current time in Kuat Systems Standard format"""
    try:
        date_data = get_galactic_date()
        return jsonify({"success": True, "data": date_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/news')
def api_news():
    """
    Holonet News Feed
    Fetches latest Star Wars book/comic news from Youtini
    """
    try:
        news_items = get_youtini_articles(limit=5)
        return jsonify({"success": True, "data": news_items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/subway')
def api_subway():
    """
    Get transit/subway arrival times
    Returns real-time arrival data for configured station
    """
    try:
        subway = get_subway_data(SUBWAY_CITY, None, SUBWAY_STATION_ID)
        return jsonify({"success": True, "data": subway})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/youtube/<category>')
def api_youtube(category):
    """
    Get YouTube video IDs for Star Wars content by category
    
    Categories: scenery, battles, music, lore
    
    Uses 24-hour caching to respect YouTube API quota limits.
    Falls back to curated video IDs if API is unavailable.
    """
    try:
        result = get_youtube_videos(YOUTUBE_API_KEY, category)
        return jsonify({
            "success": result['success'],
            "data": result['data'],
            "source": result.get('source', 'unknown'),
            "error": result.get('error')
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/youtube/categories')
def api_youtube_categories():
    """Get list of available YouTube video categories"""
    try:
        categories = get_all_categories()
        return jsonify({"success": True, "data": categories})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/food-map')
def api_food_map():
    """
    Get nearby food establishments

    Query parameters (optional):
        lat: Latitude
        lon: Longitude
        radius: Search radius in meters (default: 1000)

    If no coordinates provided, attempts to detect from IP
    """
    try:
        from flask import request

        # Get coordinates from query parameters or detect from IP
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        radius = request.args.get('radius', type=int, default=1000)

        # If no coordinates provided, try to detect location from IP
        if lat is None or lon is None:
            location = get_user_location_from_ip()
            if location:
                lat = location['latitude']
                lon = location['longitude']
                city = location.get('city', 'Unknown')
            else:
                # Fallback to default location (London)
                lat = 51.5074
                lon = -0.1278
                city = 'London'
        else:
            city = 'Custom Location'

        # Fetch nearby food places
        food_places = get_nearby_food_places(lat, lon, radius)

        return jsonify({
            "success": True,
            "data": {
                "center": {"latitude": lat, "longitude": lon},
                "city": city,
                "radius": radius,
                "places": food_places,
                "count": len(food_places)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({"status": "operational", "message": "All systems nominal"})


if __name__ == '__main__':
    # Run on all interfaces so it can be accessed from the network
    app.run(host='0.0.0.0', port=5000, debug=False)
