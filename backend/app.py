"""
Kuat Systems Dashboard - Backend API Server
Flask-based API serving system stats, weather, and bounty tracking data
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from utils.system_stats import get_system_stats
from utils.weather import get_weather_data, get_galactic_date
from utils.subway import get_subway_data
from utils.youtini import get_youtini_articles

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Configuration
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
WEATHER_LOCATION = os.getenv('WEATHER_LOCATION', 'London')
SUBWAY_CITY = os.getenv('SUBWAY_CITY', 'NYC')
SUBWAY_STATION_ID = os.getenv('SUBWAY_STATION_ID', 'D17')

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

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({"status": "operational", "message": "All systems nominal"})


if __name__ == '__main__':
    # Run on all interfaces so it can be accessed from the network
    app.run(host='0.0.0.0', port=5000, debug=False)
