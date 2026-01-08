"""
Galactic Command Dashboard - Backend API Server
Flask-based API serving system stats, weather, and bounty tracking data
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
from utils.system_stats import get_system_stats
from utils.weather import get_weather_data, get_galactic_date

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Configuration
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
WEATHER_LOCATION = os.getenv('WEATHER_LOCATION', 'London')

# Bounty Hunter Data
BOUNTY_TARGETS = [
    {"name": "Han Solo", "species": "Human", "last_seen": "Tatooine", "threat": "HIGH", "reward": 50000},
    {"name": "Chewbacca", "species": "Wookiee", "last_seen": "Kashyyyk", "threat": "MEDIUM", "reward": 25000},
    {"name": "Lando Calrissian", "species": "Human", "last_seen": "Cloud City", "threat": "LOW", "reward": 15000},
    {"name": "Boba Fett", "species": "Human Clone", "last_seen": "Kamino", "threat": "EXTREME", "reward": 100000},
    {"name": "Ahsoka Tano", "species": "Togruta", "last_seen": "Corvus", "threat": "HIGH", "reward": 75000},
    {"name": "Din Djarin", "species": "Human", "last_seen": "Nevarro", "threat": "HIGH", "reward": 60000},
    {"name": "Bo-Katan Kryze", "species": "Human", "last_seen": "Mandalore", "threat": "MEDIUM", "reward": 40000},
    {"name": "Cad Bane", "species": "Duros", "last_seen": "Tatooine", "threat": "HIGH", "reward": 55000},
    {"name": "Asajj Ventress", "species": "Dathomirian", "last_seen": "Dathomir", "threat": "EXTREME", "reward": 80000},
    {"name": "Hondo Ohnaka", "species": "Weequay", "last_seen": "Florrum", "threat": "LOW", "reward": 10000},
]

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
    """Get current time in Galactic Standard format"""
    try:
        date_data = get_galactic_date()
        return jsonify({"success": True, "data": date_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/bounty/scan')
def api_bounty_scan():
    """
    Bounty Hunter Tracking System
    Returns a random target from the database
    """
    try:
        # Randomly select 1-3 targets
        num_targets = random.randint(1, 3)
        targets = random.sample(BOUNTY_TARGETS, num_targets)

        # Add scanning coordinates
        for target in targets:
            target['coordinates'] = generate_coordinates()
            target['distance'] = round(random.uniform(0.5, 150.0), 1)  # parsecs
            target['scan_confidence'] = random.randint(65, 99)

        return jsonify({
            "success": True,
            "data": {
                "targets": targets,
                "scan_time": get_galactic_date()["galactic_standard"],
                "scanner_status": "OPERATIONAL"
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/news')
def api_news():
    """
    Holonet News Feed
    Returns mock news items (could be extended with RSS parsing)
    """
    try:
        news_items = [
            {
                "title": "Imperial Fleet Reports Increased Rebel Activity in Outer Rim",
                "source": "Imperial HoloNet News",
                "time": "2 hours ago"
            },
            {
                "title": "New TIE Fighter Prototype Exceeds Performance Expectations",
                "source": "Imperial Engineering Corps",
                "time": "5 hours ago"
            },
            {
                "title": "Death Star II Construction Ahead of Schedule",
                "source": "Imperial Command",
                "time": "8 hours ago"
            },
            {
                "title": "Mandalorian Sightings on Tatooine Investigated",
                "source": "Bounty Hunters Guild",
                "time": "12 hours ago"
            },
            {
                "title": "Trade Routes Through Hyperspace Lane 7 Temporarily Closed",
                "source": "Galactic Trade Commission",
                "time": "1 day ago"
            }
        ]

        return jsonify({"success": True, "data": news_items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def generate_coordinates():
    """Generate random galactic coordinates"""
    sectors = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"]
    quadrant = random.randint(1, 9)
    sector = random.choice(sectors)
    x = round(random.uniform(-180, 180), 2)
    y = round(random.uniform(-90, 90), 2)

    return f"{sector}-{quadrant} [{x}, {y}]"


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({"status": "operational", "message": "All systems nominal"})


if __name__ == '__main__':
    # Run on all interfaces so it can be accessed from the network
    app.run(host='0.0.0.0', port=5000, debug=False)
