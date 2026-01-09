# 🚀 Quick Start Guide

## First Time Setup (Raspberry Pi)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/star-wars-dashboard.git
cd star-wars-dashboard

# 2. Run the installer
chmod +x setup.sh
./setup.sh

# 3. Reboot to start kiosk mode
sudo reboot
```

## Development/Testing (Any System)

```bash
# Quick start for development
./run-dev.sh

# Then open in browser:
# http://localhost:5000
```

## Common Commands

### Service Management

```bash
# Check service status
sudo systemctl status kuat-systems-dashboard.service

# Start service
sudo systemctl start kuat-systems-dashboard.service

# Stop service
sudo systemctl stop kuat-systems-dashboard.service

# Restart service
sudo systemctl restart kuat-systems-dashboard.service

# View logs
sudo journalctl -u kuat-systems-dashboard.service -f
```

### Kiosk Mode

```bash
# Launch kiosk mode manually
./config/launch-kiosk.sh

# Exit kiosk mode
# Press Alt+F4 or Ctrl+W
```

### Testing API Endpoints

```bash
# System stats
curl http://localhost:5000/api/system | jq

# Weather
curl http://localhost:5000/api/weather | jq

# Time
curl http://localhost:5000/api/chronometer | jq

# Bounty scan
curl http://localhost:5000/api/bounty/scan | jq

# News
curl http://localhost:5000/api/news | jq

# Subway arrivals
curl http://localhost:5000/api/subway | jq

# Health check
curl http://localhost:5000/health
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (API keys, location, station ID) |
| `backend/requirements.txt` | Python dependencies |
| `frontend/css/main.css` | Styling and theme customization |
| `frontend/js/app.js` | Update intervals and app logic |
| `config/autostart.desktop` | Auto-start configuration |

## Quick Customization

### Change Update Frequencies

Edit `frontend/js/app.js`:

```javascript
// Update intervals (milliseconds)
this.chronoInterval = 1000;      // Time: every 1 second
this.systemInterval = 5000;      // System: every 5 seconds
this.weatherInterval = 300000;   // Weather: every 5 minutes
this.newsInterval = 600000;      // News: every 10 minutes
this.subwayInterval = 60000;     // Subway: every 1 minute
```

### Change Colors

Edit `frontend/css/main.css` CSS variables:

```css
:root {
    --imperial-red: #ff0000;
    --imperial-blue: #00d4ff;
    --imperial-green: #00ff41;
    /* ... modify as needed ... */
}
```

### Disable Scanline Effect (Performance)

In `frontend/css/main.css`:

```css
.scanline-overlay {
    display: none;  /* Disable for better performance */
}
```

## Troubleshooting

### Service won't start

```bash
# Check Python version (needs 3.7+)
python3 --version

# Check if port 5000 is in use
sudo lsof -i :5000

# View detailed error logs
sudo journalctl -u kuat-systems-dashboard.service -n 50 --no-pager
```

### Weather not working

```bash
# Check .env file exists
cat .env

# Test API manually
curl "http://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY&units=metric"
```

### Subway not showing

```bash
# Check if station ID is configured in .env
grep SUBWAY .env

# Test subway API endpoint
curl http://localhost:5000/api/subway | jq

# Check if stations database exists
ls -lh backend/data/stations.db
```

### Kiosk mode issues

```bash
# Check if Chromium is installed
which chromium-browser

# Check autostart file
cat ~/.config/autostart/kuat-systems-dashboard.desktop

# Test launch script manually
bash -x ./config/launch-kiosk.sh
```

## Performance Optimization

For better performance on Raspberry Pi 3 or older:

1. Increase update intervals (`frontend/js/app.js`):
   ```javascript
   this.systemInterval = 10000;   // 10 seconds instead of 5
   this.weatherInterval = 600000; // 10 minutes instead of 5
   this.subwayInterval = 120000;  // 2 minutes instead of 1
   ```

2. Disable CRT flicker effect (see above)

## Default Credentials & Ports

- **Backend Port**: 5000
- **No authentication** (designed for local network use)

## Need Help?

1. Check the main [README.md](README.md)
2. Review error logs: `sudo journalctl -u kuat-systems-dashboard.service -f`
3. Test API endpoints individually (see above)
4. Open an issue on GitHub

---

**May the Force be with you!** 🌟
