"""
Weather Data Module for Galactic Command Dashboard
Retrieves atmospheric conditions (weather data)
"""

import requests
from datetime import datetime


def get_weather_data(api_key=None, location="London"):
    """
    Fetch weather data from OpenWeatherMap API
    Falls back to mock data if API key not provided

    To get a free API key: https://openweathermap.org/api
    """
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        # Return mock data for development/demo
        return get_mock_weather()

    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()
            return parse_weather_data(data)
        else:
            return get_mock_weather()
    except Exception as e:
        print(f"Weather API error: {e}")
        return get_mock_weather()


def parse_weather_data(data):
    """Parse OpenWeatherMap API response into themed format"""
    return {
        "location": data.get("name", "Unknown Sector"),
        "temperature": round(data["main"]["temp"]),
        "feels_like": round(data["main"]["feels_like"]),
        "humidity": data["main"]["humidity"],
        "pressure": data["main"]["pressure"],
        "description": data["weather"][0]["description"].title(),
        "icon": data["weather"][0]["icon"],
        "wind_speed": round(data["wind"]["speed"] * 3.6, 1),  # Convert m/s to km/h
        "visibility": data.get("visibility", 10000) / 1000,  # Convert to km
        "atmospheric_status": get_atmospheric_status(data)
    }


def get_atmospheric_status(data):
    """Convert weather data to Imperial atmospheric classification"""
    weather_id = data["weather"][0]["id"]

    # Thunderstorm
    if 200 <= weather_id < 300:
        return "ION STORM DETECTED"
    # Drizzle/Rain
    elif 300 <= weather_id < 600:
        return "PRECIPITATION ACTIVE"
    # Snow
    elif 600 <= weather_id < 700:
        return "FROZEN PRECIPITATION"
    # Atmosphere (fog, mist, etc.)
    elif 700 <= weather_id < 800:
        return "VISIBILITY REDUCED"
    # Clear
    elif weather_id == 800:
        return "ATMOSPHERIC CLARITY OPTIMAL"
    # Clouds
    else:
        return "CLOUD COVERAGE DETECTED"


def get_mock_weather():
    """Return mock weather data for demo purposes"""
    return {
        "location": "Coruscant Sector",
        "temperature": 22,
        "feels_like": 21,
        "humidity": 65,
        "pressure": 1013,
        "description": "Partly Cloudy",
        "icon": "02d",
        "wind_speed": 15.5,
        "visibility": 10.0,
        "atmospheric_status": "ATMOSPHERIC CLARITY OPTIMAL"
    }


def get_galactic_date():
    """
    Convert Earth date to 'Galactic Standard Calendar' format
    Format: GS [Year]:[Day of Year]:[Hour]:[Minute]
    """
    now = datetime.now()
    day_of_year = now.timetuple().tm_yday

    return {
        "earth_date": now.strftime("%Y-%m-%d"),
        "earth_time": now.strftime("%H:%M:%S"),
        "galactic_standard": f"GS {now.year}:{day_of_year:03d}:{now.hour:02d}:{now.minute:02d}",
        "timestamp": int(now.timestamp())
    }
