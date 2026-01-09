# 📊 Kuat Systems Dashboard - Project Summary

## Overview

A complete, production-ready Star Wars-themed dashboard system optimized for Raspberry Pi and curved/ultra-wide monitors. Built with Python Flask backend and vanilla JavaScript frontend for maximum performance on resource-constrained devices.

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Python 3.7+ with Flask
- psutil for system monitoring
- requests for external APIs
- flask-cors for cross-origin support
- gtfs-realtime-bindings for NYC subway data
- beautifulsoup4 and lxml for web scraping

**Frontend:**
- Vanilla JavaScript (no frameworks for better Pi performance)
- CSS3 with custom animations
- HTML5 Canvas for screensaver
- Responsive CSS Grid layout

**Deployment:**
- systemd service for auto-start
- Chromium browser in kiosk mode
- LXDE autostart integration

## 📁 Complete File Structure

```
star-wars-dashboard/
│
├── backend/                          # Python Flask API Server
│   ├── app.py                       # Main Flask application (API routes)
│   ├── requirements.txt             # Python dependencies
│   ├── cron/
│   │   └── refresh_news.py         # Hourly news cache refresh script
│   ├── data/
│   │   └── stations.db             # NYC subway stations database (SQLite)
│   └── utils/
│       ├── system_stats.py         # System monitoring (CPU, RAM, Disk, Temp)
│       ├── weather.py              # Weather data fetching & parsing
│       ├── subway.py               # NYC subway real-time arrivals (GTFS)
│       └── youtini.py              # Star Wars news scraper with caching
│
├── frontend/                         # Web Frontend
│   ├── index.html                   # Main dashboard HTML structure
│   ├── css/
│   │   ├── main.css                # Core styles, theme, layout
│   │   └── animations.css          # Screensaver & animation effects
│   ├── js/
│   │   ├── app.js                  # Main app logic, API calls
│   │   ├── screensaver.js          # Hyperspace animation
│   │   └── bounty_tracker.js       # Bounty hunting module
│   └── fonts/                       # (Empty - user adds Star Wars fonts)
│
├── config/                           # Configuration Files
│   └── autostart.desktop            # LXDE autostart template
│
├── setup.sh                          # Automated installer script
├── run-dev.sh                        # Development server launcher
├── .gitignore                        # Git ignore rules
├── LICENSE                           # MIT License
├── README.md                         # Main documentation
├── QUICK_START.md                    # Quick reference guide
└── PROJECT_SUMMARY.md                # This file
```

## 🎯 Core Features Implementation

### 1. System Diagnostics (Reactor Core)

**File:** `backend/utils/system_stats.py`

- Reads CPU temperature from `/sys/class/thermal/thermal_zone0/temp`
- Uses psutil for CPU, RAM, and disk metrics
- Transforms data into "Imperial" themed labels
- Returns status levels: OPTIMAL, NOMINAL, DEGRADED, CRITICAL

**Frontend:** `frontend/js/app.js` (updateSystemStats)

- Fetches data every 5 seconds
- Updates progress bars with smooth transitions
- Dynamic color coding based on status
- Alerts on critical temperatures

### 2. Weather System (Atmospheric Data)

**File:** `backend/utils/weather.py`

- Integrates with OpenWeatherMap API
- Falls back to mock data if no API key
- Converts weather codes to "Imperial" status messages
- Includes Kuat Systems Standard Calendar conversion

**Frontend:** Visual display in right panel with:
- Large temperature display
- Detailed metrics (humidity, wind, visibility)
- Status badges with color coding

### 3. Chronometer (Time Display)

**Backend:** Provides both Earth time and "Kuat Systems Standard" format
**Frontend:** Updates every second in header
- Format: GS YEAR:DAY:HOUR:MINUTE
- Dual display (Kuat Systems + Earth)

### 4. Bounty Hunter Tracking

**File:** `frontend/js/bounty_tracker.js`

- Interactive "SCAN" button
- Scanning animation effect
- Randomized target selection from database
- Generates Kuat systems coordinates
- Displays threat levels and rewards

### 5. HoloNet News Feed

**File:** `backend/utils/youtini.py`

- Web scrapes Star Wars news from Youtini.com
- Intelligent caching system (55-minute TTL)
- Exponential backoff retry logic (4 retries)
- Parses article titles, dates, and categories
- Converts dates to relative time format
- Optional cron job for hourly cache refresh

**Cron Script:** `backend/cron/refresh_news.py`

- Pre-warms news cache hourly
- Rotating log files (1MB, 5 backups)
- Prevents cache misses during user requests

**Frontend:** Scrollable feed with fade-in animations

### 6. Hyperspace Screensaver

**File:** `frontend/js/screensaver.js`

- HTML5 Canvas-based animation
- 200 stars moving toward viewer
- 3D to 2D projection
- Activates after 10 minutes of inactivity
- Deactivates on any user interaction

### 7. NYC Subway Transit Monitor

**File:** `backend/utils/subway.py`

- Real-time GTFS data from MTA
- SQLite database for station information
- Automatic database initialization from MTA CSV
- Station-based filtering (only shows trains stopping at configured station)
- Direction separation (northbound/southbound with custom labels)
- Groups by route + direction combination
- Updates every 60 seconds

**Database:** `backend/data/stations.db`

- Downloaded from MTA Stations.csv on first run
- Caches station names, routes, and direction labels
- Enables efficient filtering and labeling

**Frontend:** `frontend/js/app.js` (updateSubway)

- Displays route badges with MTA colors
- Shows direction labels
- Lists arrival times in minutes
- Status indicators for service delays

## 🎨 Design Philosophy

### Curved Display Optimization

**Layout Strategy:**
- 3-column grid: Left (diagnostics) | Center (news/bounty) | Right (weather)
- Important data on sides (natural peripheral vision on curved screens)
- Central focus for dynamic content
- Responsive breakpoints for smaller displays

### Performance Optimization

**Why Vanilla JS?**
- No framework overhead (React, Vue would be too heavy for Pi)
- Smaller bundle size
- Faster initial load
- Direct DOM manipulation for better control

**CSS Optimizations:**
- Hardware-accelerated transforms
- Minimal repaints/reflows
- Efficient animations using requestAnimationFrame
- Optional disable of heavy effects (CRT flicker)

### Theme Implementation

**Color Palette:**
- Deep blacks (#0a0a0a) for OLED-friendly display
- Cyan (#00d4ff) for primary highlights
- Red (#ff0000) for alerts/threats
- Green (#00ff41) for optimal status

**Visual Effects:**
- Scanline overlay (authentic CRT feel)
- Subtle flicker animation
- Glow effects on text
- Border animations on panels

## 🔧 API Architecture

### RESTful Endpoints

| Endpoint | Method | Refresh Rate | Purpose |
|----------|--------|--------------|---------|
| `/` | GET | Once | Serve main HTML |
| `/api/system` | GET | 5s | System diagnostics |
| `/api/weather` | GET | 5m | Atmospheric data |
| `/api/chronometer` | GET | 1s | Current time |
| `/api/bounty/scan` | GET | On-demand | Target detection |
| `/api/news` | GET | 10m | Youtini news feed |
| `/api/subway` | GET | 1m | NYC subway arrivals |
| `/health` | GET | On-demand | Service status |

### Data Flow

```
User Browser (Frontend)
    ↓
    ├─ index.html (structure)
    ├─ main.css (styling)
    └─ app.js (logic)
         ↓
         HTTP Requests (fetch API)
         ↓
Flask Backend (API Server)
    ↓
    ├─ system_stats.py → psutil → System Metrics
    ├─ weather.py → OpenWeatherMap API → Weather Data
    └─ app.py → JSON Response
         ↓
         ← Returns JSON
         ↓
Frontend Updates DOM Elements
```

## 🔧 Caching & Performance

### News Caching Strategy

- **In-memory cache** with 55-minute TTL
- **Exponential backoff** for failed requests (1s, 2s, 4s, 8s)
- **Optional cron job** for hourly pre-warming
- **Rotating logs** for monitoring (1MB files, 5 backups)

### Subway Data Optimization

- **SQLite database** caches station metadata
- **One-time download** of MTA Stations.csv
- **Efficient filtering** by station routes
- **GTFS real-time** updates every 60 seconds

## 🚀 Deployment Strategy

### Systemd Service

- **Name:** `kuat-systems-dashboard.service`
- **Type:** Simple (foreground process)
- **Restart Policy:** Always (auto-recovery)
- **User:** Non-root for security

### Kiosk Mode Setup

1. **Hide cursor:** unclutter utility
2. **Disable screensaver:** xset commands
3. **Full-screen browser:** Chromium with --kiosk flag
4. **Disable popups:** --noerrdialogs, --disable-infobars
5. **Auto-launch:** LXDE autostart desktop entry

### Boot Sequence

```
1. Raspberry Pi boots
2. systemd starts kuat-systems-dashboard.service
3. Flask backend starts on port 5000
4. LXDE desktop loads
5. Autostart launches launch-kiosk.sh
6. Script waits for backend health check
7. Chromium opens in kiosk mode to localhost:5000
8. Dashboard displays full-screen
```

## 📊 Performance Benchmarks

**Target Performance (Raspberry Pi 4):**
- Initial load: < 2 seconds
- API response time: < 100ms
- Screensaver FPS: 30-60 fps
- Memory usage: < 200MB (backend + frontend)
- CPU idle: < 5%

**Optimization Techniques:**
- Efficient CSS selectors
- Debounced event handlers
- Lazy loading for animations
- Conditional rendering
- Minimal HTTP requests

## 🔐 Security Considerations

**Current Implementation:**
- No authentication (designed for local network)
- CORS enabled for development
- No sensitive data storage
- API keys in environment variables (.env)

**Recommendations for Production:**
- Reverse proxy (nginx) with HTTPS
- Rate limiting on API endpoints
- API key rotation
- Firewall rules (restrict to local network)
- Regular dependency updates

## 🧩 Extensibility

### Easy Customizations

1. **Add New Data Modules:**
   - Create new API endpoint in `backend/app.py`
   - Add utility module in `backend/utils/`
   - Add fetch function in `frontend/js/app.js`
   - Design panel in `frontend/index.html`

2. **Add News Sources:**
   - Modify `backend/utils/youtini.py` scraper
   - Or create new scraper in `backend/utils/`
   - Update `api_news()` in `backend/app.py`
   - Consider adding cron refresh script

3. **Add Transit Systems:**
   - Create new utility in `backend/utils/` (similar to subway.py)
   - Add station database or API integration
   - Update frontend to display transit data
   - Configure via environment variables

3. **Add Multiple Themes:**
   - Create CSS variable sets in `frontend/css/main.css`
   - Add theme switcher button in `frontend/index.html`
   - Store preference in localStorage via `frontend/js/app.js`

4. **Smart Home Integration:**
   - Add Home Assistant API calls
   - Display device status as "Fleet"
   - Control lights/switches as "System Controls"

### Advanced Extensions

- **Voice Commands:** Integrate with Google Assistant SDK
- **Network Monitor:** Show connected devices as "Fleet Status"
- **Calendar Integration:** Display as "Mission Schedule"
- **Music Player:** Control as "Communications Channel"
- **Security Cameras:** Display as "Surveillance Grid"

## 📈 Future Roadmap

### Phase 1 (Current) ✅
- [x] Core dashboard functionality
- [x] System monitoring
- [x] Weather integration
- [x] Screensaver
- [x] Bounty tracking
- [x] Kiosk mode setup
- [x] Youtini news scraping with caching
- [x] NYC subway real-time arrivals

### Phase 2 (Planned)
- [ ] Support for other transit systems (London, BART, etc.)
- [ ] Multiple screensaver modes
- [ ] Theme switcher
- [ ] Historical data charts
- [ ] Mobile companion app

### Phase 3 (Future)
- [ ] Multi-language support (Aurebesh!)
- [ ] Voice command integration
- [ ] Smart home integration
- [ ] Network monitoring
- [ ] Plugin system

## 🤝 Contributing Guidelines

1. **Code Style:**
   - Python: PEP 8
   - JavaScript: ESLint standard
   - CSS: BEM naming convention

2. **Testing:**
   - Test on Raspberry Pi hardware
   - Verify kiosk mode functionality
   - Check API endpoints individually

3. **Documentation:**
   - Update README.md for new features
   - Add inline code comments
   - Include usage examples

## 📝 License & Attribution

- **License:** MIT (open source)
- **Star Wars IP:** Fan project, not affiliated with Lucasfilm/Disney
- **Dependencies:** See `backend/requirements.txt`
- **Fonts:** User must provide Star Wars fonts separately

## 🎓 Learning Resources

This project demonstrates:
- **Flask API design**
- **Responsive CSS Grid layouts**
- **Canvas animations**
- **systemd service creation**
- **Linux kiosk mode setup**
- **RESTful API consumption**
- **Real-time data updates**

Perfect for learning:
- Raspberry Pi deployment
- Full-stack web development
- System administration
- UI/UX design for specific hardware

---

**Total Lines of Code:** ~2,500 lines
**Languages:** Python, JavaScript, CSS, HTML, Bash
**Development Time:** Optimized for clarity and maintainability

**May the Force be with you!** 🌟
