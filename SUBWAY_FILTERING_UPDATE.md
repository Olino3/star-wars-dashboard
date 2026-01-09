# Subway Feature Update: Station Filtering & Direction Separation

> **Note:** This feature has been fully implemented and integrated into the dashboard. This document serves as technical reference documentation for the subway feature implementation.
> 
> For user documentation, see:
> - [README.md](README.md) - User guide and configuration
> - [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Architecture overview
> - [QUICK_START.md](QUICK_START.md) - Quick reference

## Overview
Updated the NYC subway feature to:
1. **Filter trains by station** - Only show trains that actually stop at the configured station (not all nearby trains)
2. **Separate by direction** - Display trains grouped by both route AND direction

## Changes Made

### Backend Changes

#### 1. Database Integration (`backend/utils/subway.py`)

**Added SQLite database for station data:**
- `initialize_stations_db()` - Downloads and parses MTA Stations.csv on first run
- `get_station_info(station_id)` - Retrieves station name, routes, and direction labels from database
- Database stored at: `backend/data/stations.db`
- Automatically downloads from: `http://web.mta.info/developers/data/nyct/subway/Stations.csv`

**Updated parsing functions:**
- `parse_mta_feed()` - Now filters by station routes and extracts direction information
  - Added `station_routes` parameter to filter only trains serving the station
  - Extracts `direction_id` and `trip_headsign` from GTFS data
  - Determines direction from stop_id suffix (N/S)
  
- `get_mta_subway_data()` - Fetches station info and passes routes to parser
  - Calls `get_station_info()` to get valid routes
  - Passes station routes to `parse_mta_feed()` for filtering
  - Passes full station_info to `format_arrivals()` for direction labels

- `format_arrivals()` - Groups by route AND direction
  - Creates unique key for each route+direction combination
  - Uses custom direction labels from station database when available
  - Falls back to stop_id suffix (N/S) for direction determination
  - Sorts all arrivals by soonest time across all route+direction combinations
  - Returns station name from database

**Updated data structure:**
```python
{
    'station': 'Times Sq-42 St',  # From database
    'lines': [
        {
            'route': 'D',
            'direction': 'Coney Island-Stillwell Av',  # NEW
            'arrivals': [1, 3, 12],
            'delayed': False,
            'color': '#FF6319'
        },
        {
            'route': 'D',
            'direction': 'Norwood-205 St',  # NEW - Opposite direction
            'arrivals': [2, 5, 13],
            'delayed': False,
            'color': '#FF6319'
        }
    ],
    'status': 'OPERATIONAL'
}
```

### Frontend Changes

#### 1. JavaScript (`frontend/js/app.js`)

**Updated `updateSubway()` method:**
- Added direction label display in line format
- Format: `Route (Direction): times`
- Example: `D (Manhattan): 1, 3, 12 min`

**HTML structure generated:**
```html
<span class="route-badge route-D" style="background-color: #FF6319">D</span>
<span class="route-direction">(Manhattan)</span>
<span class="arrival-times">1, 3, 12 min</span>
```

#### 2. CSS (`frontend/css/main.css`)

**Added `.route-direction` styling:**
- Cyan color for visual consistency
- Smaller font size (0.85rem)
- Italic style for differentiation
- Positioned between route badge and arrival times

## How It Works

### Station Filtering Flow
1. User configures `SUBWAY_STATION_ID` (e.g., "R16" for Times Square)
2. On first run, system downloads MTA Stations.csv and creates SQLite database
3. System looks up station to find routes that serve it (e.g., ["N", "Q", "R", "W"] for Times Sq)
4. When parsing GTFS feeds, only trains on those routes are included
5. Trains not stopping at that station are filtered out

### Direction Separation Flow
1. GTFS data includes `direction_id` (0 or 1) and optional `trip_headsign`
2. System extracts stop_id suffix (e.g., "R16N" vs "R16S") for north/south determination
3. Direction labels come from station database (e.g., "Uptown & The Bronx", "Downtown & Brooklyn")
4. Each route+direction combination is treated as a separate line
5. All lines sorted by soonest arrival time

### Example Display
For Times Square-42 St station:
```
D (Coney Island): 1, 3, 12 min
N (Uptown & Queens): 2, 4, 10 min  
D (Norwood): 2, 5, 13 min
Q (Downtown & Brooklyn): 5, 8, 15 min
```

## Database Schema

**stations table:**
- `station_id` - Primary key (e.g., "R16")
- `stop_name` - Human-readable name
- `daytime_routes` - Space-separated route list
- `north_direction_label` - Custom label for northbound trains
- `south_direction_label` - Custom label for southbound trains
- Plus latitude, longitude, borough, etc.

## Testing

**Mock data updated:**
- Includes direction labels for testing
- Multiple directions for same route (D line both ways)
- Validates frontend display without live API

**To test with real data:**
1. Configure valid `SUBWAY_STATION_ID` in `.env`
2. Start backend: `python3 backend/app.py`
3. Database will auto-initialize on first request
4. Open dashboard to see filtered, direction-separated trains

## Benefits

1. **Accuracy** - Only shows trains at YOUR station
2. **Clarity** - Separate northbound/southbound trains
3. **Flexibility** - Custom direction labels per station (Manhattan vs Coney Island)
4. **Performance** - SQLite caching prevents repeated CSV downloads
5. **Scalability** - Database approach supports future enhancements (transfers, alerts, etc.)
