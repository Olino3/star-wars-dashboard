"""
Transit Data Module for Kuat Systems Dashboard
Retrieves subway/metro arrival times for configured stations
"""

import requests
from datetime import datetime, timedelta
from google.transit import gtfs_realtime_pb2
import time
import sqlite3
import csv
import os
from pathlib import Path


# MTA Feed mapping based on station prefixes to line groups
# MTA now uses line group names instead of numeric feed IDs
MTA_FEED_MAPPING = {
    # ACE feeds
    'A': 'ace', 'C': 'ace', 'E': 'ace', 'H': 'ace', 'FS': 'ace',
    # BDFM feeds
    'B': 'bdfm', 'D': 'bdfm', 'F': 'bdfm', 'M': 'bdfm',
    # G feed
    'G': 'g',
    # JZ feed
    'J': 'jz', 'Z': 'jz',
    # L feed
    'L': 'l',
    # NQRW feeds
    'N': 'nqrw', 'Q': 'nqrw', 'R': 'nqrw', 'W': 'nqrw',
    # 123456 feeds
    '1': '123456', '2': '123456', '3': '123456', '4': '123456', '5': '123456', '6': '123456',
    # 7 feed
    '7': '7',
    # SIR feed
    'SI': 'si',
}

# MTA official subway line colors
MTA_LINE_COLORS = {
    'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',  # Blue
    'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',  # Orange
    'G': '#6CBE45',  # Green
    'J': '#996633', 'Z': '#996633',  # Brown
    'L': '#A7A9AC',  # Gray
    'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',  # Yellow
    '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',  # Red
    '4': '#00933C', '5': '#00933C', '6': '#00933C',  # Green
    '7': '#B933AD',  # Purple
    'S': '#808183',  # Gray (Shuttle)
}

# Database path
DB_PATH = Path(__file__).parent.parent / 'data' / 'stations.db'

# Response cache
_cache = {
    'data': None,
    'timestamp': None,
    'ttl': 45  # Cache for 45 seconds
}

def initialize_stations_db():
    """
    Initialize SQLite database with MTA station data from CSV
    Downloads and parses Stations.csv on first run
    """
    # Create data directory if it doesn't exist
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # If database already exists, skip initialization
    if DB_PATH.exists():
        return
    
    print("Initializing MTA stations database...")
    
    # Create database and table
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stations (
            station_id TEXT PRIMARY KEY,
            complex_id TEXT,
            gtfs_stop_id TEXT,
            division TEXT,
            line TEXT,
            stop_name TEXT,
            borough TEXT,
            daytime_routes TEXT,
            structure TEXT,
            gtfs_latitude REAL,
            gtfs_longitude REAL,
            north_direction_label TEXT,
            south_direction_label TEXT
        )
    ''')
    
    # Download stations CSV
    csv_url = "http://web.mta.info/developers/data/nyct/subway/Stations.csv"
    try:
        response = requests.get(csv_url, timeout=10)
        response.raise_for_status()
        
        # Parse CSV and insert into database
        csv_data = response.text.splitlines()
        reader = csv.DictReader(csv_data)
        
        for row in reader:
            cursor.execute('''
                INSERT OR REPLACE INTO stations VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            ''', (
                row.get('Station ID', ''),
                row.get('Complex ID', ''),
                row.get('GTFS Stop ID', ''),
                row.get('Division', ''),
                row.get('Line', ''),
                row.get('Stop Name', ''),
                row.get('Borough', ''),
                row.get('Daytime Routes', ''),
                row.get('Structure', ''),
                float(row.get('GTFS Latitude', 0)),
                float(row.get('GTFS Longitude', 0)),
                row.get('North Direction Label', ''),
                row.get('South Direction Label', '')
            ))
        
        conn.commit()
        print(f"Stations database initialized with {cursor.rowcount} records")
        
    except Exception as e:
        print(f"Error initializing stations database: {e}")
    finally:
        conn.close()

def get_station_info(station_id):
    """
    Get station information from database
    
    Args:
        station_id: MTA Station ID (e.g., "R16" for Times Sq-42 St)
    
    Returns:
        dict with routes, name, and direction labels, or None if not found
    """
    # Initialize database if needed
    initialize_stations_db()
    
    if not DB_PATH.exists():
        return None
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT stop_name, daytime_routes, north_direction_label, south_direction_label, gtfs_stop_id
            FROM stations
            WHERE station_id = ?
            LIMIT 1
        ''', (station_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            name, routes, north_label, south_label, gtfs_stop_id = result
            # Parse routes into list
            route_list = [r.strip() for r in routes.split()] if routes else []
            
            return {
                'name': name,
                'routes': route_list,
                'north_label': north_label or 'Uptown & The Bronx',
                'south_label': south_label or 'Downtown & Brooklyn',
                'gtfs_stop_id': gtfs_stop_id
            }
        
        return None
        
    except Exception as e:
        print(f"Error querying station info: {e}")
        return None


def get_subway_data(city="NYC", api_key=None, station_id=None):
    """
    Main dispatcher function for subway data retrieval
    Routes to city-specific implementations
    
    Args:
        city: City code (NYC, DC, LON, etc.)
        api_key: API key for the transit service (optional, not required for MTA)
        station_id: Station identifier
    
    Returns:
        dict: Standardized transit data
    """
    if city.upper() == "NYC":
        return get_mta_subway_data(station_id)
    # Future city implementations:
    # elif city.upper() == "DC":
    #     return get_wmata_subway_data(api_key, station_id)
    # elif city.upper() == "LON":
    #     return get_tfl_subway_data(api_key, station_id)
    else:
        return get_mock_subway()


def get_mta_subway_data(station_id=None):
    """
    Fetch NYC MTA subway data using GTFS Realtime API
    MTA API no longer requires authentication keys
    
    Args:
        station_id: MTA station ID (e.g., D17, A42)
    
    Returns:
        dict: Formatted subway arrival data
    """
    if not station_id:
        return get_mock_subway()
    
    # Get station info from database
    station_info = get_station_info(station_id)
    if not station_info:
        print(f"Warning: Station {station_id} not found in database")
        return get_mock_subway()
    
    # Check cache
    if _cache['data'] and _cache['timestamp']:
        age = (datetime.now() - _cache['timestamp']).total_seconds()
        if age < _cache['ttl']:
            return _cache['data']
    
    try:
        # Determine which feed(s) to query based on station routes
        feed_ids = get_feed_ids_for_routes(station_info['routes'])
        
        all_arrivals = []
        
        for feed_id in feed_ids:
            url = f"https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-{feed_id}"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                # Parse GTFS Realtime protobuf
                feed = gtfs_realtime_pb2.FeedMessage()
                feed.ParseFromString(response.content)
                
                # Extract arrivals for this station (with route filtering)
                arrivals = parse_mta_feed(feed, station_info['gtfs_stop_id'], station_info['routes'])
                all_arrivals.extend(arrivals)
        
        # Format and group arrivals
        result = format_arrivals(all_arrivals, station_info)
        
        # Cache the result
        _cache['data'] = result
        _cache['timestamp'] = datetime.now()
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"MTA API error: {e}")
        return get_mock_subway()
    except Exception as e:
        print(f"Error processing MTA data: {e}")
        return get_mock_subway()


def get_feed_ids_for_routes(routes):
    """
    Determine which MTA feed(s) to query based on route list
    
    Args:
        routes: List of route IDs (e.g., ['D', 'N', 'Q'])
    
    Returns:
        list: Unique feed group names to query
    """
    feed_ids = set()
    
    for route in routes:
        if route in MTA_FEED_MAPPING:
            feed_ids.add(MTA_FEED_MAPPING[route])
    
    # If no feeds found, use major feeds as fallback
    if not feed_ids:
        return ['123456', 'nqrw', 'bdfm', 'ace']
    
    return list(feed_ids)


def get_feed_ids_for_station(station_id):
    """
    Determine which MTA feed(s) to query based on station ID
    
    Args:
        station_id: MTA station ID (e.g., D17, A42)
    
    Returns:
        list: Feed group names to query
    """
    # Extract prefix from station ID
    prefix = ''.join(filter(str.isalpha, station_id))
    
    # Get feed group name from mapping
    if prefix in MTA_FEED_MAPPING:
        return [MTA_FEED_MAPPING[prefix]]
    
    # If unknown, try multiple major feeds (fallback)
    return ['123456', 'nqrw', 'bdfm', 'ace']  # Major line groups


def parse_mta_feed(feed, gtfs_stop_id, station_routes=None):
    """
    Parse GTFS Realtime feed and extract arrivals for station
    
    Args:
        feed: GTFS Realtime FeedMessage
        gtfs_stop_id: GTFS stop ID to filter for (e.g., "B18" for 79 St)
        station_routes: List of routes serving this station (for filtering)
    
    Returns:
        list: List of arrival dicts with route, direction, minutes, etc.
    """
    arrivals = []
    current_time = int(time.time())
    
    for entity in feed.entity:
        if entity.HasField('trip_update'):
            trip = entity.trip_update
            
            # Get route ID (line)
            route_id = trip.trip.route_id if trip.trip.HasField('route_id') else None
            
            # Filter: Only include trains on routes that serve this station
            if station_routes and route_id not in station_routes:
                continue
            
            # Get direction (0 = one direction, 1 = opposite direction)
            direction_id = trip.trip.direction_id if trip.trip.HasField('direction_id') else None
            
            for stop_update in trip.stop_time_update:
                # Match station (MTA uses GTFS stop ID + direction suffix like B18N/B18S)
                stop_id = stop_update.stop_id
                
                if stop_id.startswith(gtfs_stop_id):
                    # Get arrival time
                    if stop_update.HasField('arrival'):
                        arrival_time = stop_update.arrival.time
                    elif stop_update.HasField('departure'):
                        arrival_time = stop_update.departure.time
                    else:
                        continue
                    
                    # Calculate minutes until arrival
                    minutes = int((arrival_time - current_time) / 60)
                    
                    # Only include future arrivals within reasonable time (next 30 min)
                    if 0 <= minutes <= 30:
                        arrivals.append({
                            'route': route_id,
                            'direction_id': direction_id,
                            'stop_id': stop_id,
                            'minutes': minutes,
                            'timestamp': arrival_time,
                            'is_realtime': stop_update.arrival.HasField('delay') if stop_update.HasField('arrival') else False
                        })
    
    return arrivals


def format_arrivals(arrivals, station_info):
    """
    Group and format arrivals by route AND direction
    
    Args:
        arrivals: List of arrival dicts with route, direction_id, minutes, etc.
        station_info: Dict with station name and direction labels
    
    Returns:
        dict: Formatted data for frontend
    """
    # Group by route + direction
    route_directions = {}
    has_delays = False
    
    for arrival in arrivals:
        route = arrival['route']
        direction_id = arrival.get('direction_id', 0)
        
        # Determine direction label using stop_id suffix (N/S)
        stop_id = arrival.get('stop_id', '')
        if stop_id.endswith('N'):
            direction_label = station_info.get('north_label', 'Uptown')
        elif stop_id.endswith('S'):
            direction_label = station_info.get('south_label', 'Downtown')
        else:
            # Fallback to direction_id
            direction_label = station_info.get('north_label', 'Uptown') if direction_id == 1 else station_info.get('south_label', 'Downtown')
        
        # Create unique key for route+direction
        key = f"{route}_{direction_label}"
        
        if key not in route_directions:
            route_directions[key] = {
                'route': route,
                'direction': direction_label,
                'times': []
            }
        
        route_directions[key]['times'].append(arrival['minutes'])
    
    # Sort times within each route+direction and limit to 3
    lines = []
    for key, data in route_directions.items():
        data['times'].sort()
        limited_times = data['times'][:3]  # Limit to next 3 arrivals
        
        lines.append({
            'route': data['route'],
            'direction': data['direction'],
            'arrivals': limited_times,
            'delayed': False,  # TODO: Add delay detection from service alerts
            'color': MTA_LINE_COLORS.get(data['route'], '#808183')
        })
    
    # Sort all lines by soonest arrival (across all routes and directions)
    lines.sort(key=lambda x: x['arrivals'][0] if x['arrivals'] else 999)
    
    # Determine overall status
    status = "OPERATIONAL"
    if has_delays:
        status = "DELAYS REPORTED"
    
    return {
        'station': station_info.get('name', 'Unknown Station'),
        'lines': lines,
        'status': status,
        'timestamp': datetime.now().isoformat()
    }


def get_mock_subway():
    """
    Return mock subway data for development/demo
    Mimics the structure of real MTA data with direction separation
    
    Returns:
        dict: Mock transit data
    """
    return {
        'station': 'Kuat Drive Yards Transit Hub',
        'lines': [
            {
                'route': 'D',
                'direction': 'Manhattan',
                'arrivals': [1, 4, 8],
                'delayed': False,
                'color': '#FF6319'
            },
            {
                'route': 'D',
                'direction': 'Coney Island',
                'arrivals': [2, 5, 9],
                'delayed': False,
                'color': '#FF6319'
            },
            {
                'route': 'N',
                'direction': 'Uptown & Queens',
                'arrivals': [3, 7, 12],
                'delayed': False,
                'color': '#FCCC0A'
            },
            {
                'route': 'Q',
                'direction': 'Downtown & Brooklyn',
                'arrivals': [5, 10, 15],
                'delayed': True,
                'color': '#FCCC0A'
            }
        ],
        'status': 'OPERATIONAL',
        'timestamp': datetime.now().isoformat()
    }
