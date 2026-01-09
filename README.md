# 🌟 Kuat Systems Dashboard

A Star Wars-themed tactical display optimized for Raspberry Pi and curved/ultra-wide monitors. Transform your display into a Kuat Systems Engineering Command Center with real-time system monitoring, atmospheric data, and bounty tracking capabilities.

![Dashboard Preview](https://via.placeholder.com/1200x400/0a0a0a/00d4ff?text=Kuat+Systems+Dashboard)

## ✨ Features

### Core Modules

- **⏰ Chronometer**: Kuat Systems Standard Time with Earth date/time display
- **🌡️ Reactor Core Status**: Real-time CPU temperature and stability monitoring
- **💾 Memory Banks**: RAM usage with integrity indicators
- **💿 Storage Systems**: Disk space capacity tracking
- **🌍 Atmospheric Data**: Live weather information for your location
- **📡 HoloNet News Feed**: Kuat systems news updates (expandable with RSS feeds)
- **🎯 Bounty Hunter Tracking**: Secret scanning module for detecting targets
- **🚀 Hyperspace Screensaver**: Animated screensaver that activates after 10 minutes of inactivity

### Aesthetics

- **Imperial Theme**: Dark palette with cyan/red accent colors
- **Star Wars Fonts**: Styled typography reminiscent of Kuat systems interfaces
- **CRT Effects**: Authentic scanlines and flicker effects for retro-futuristic appeal
- **Curved Display Optimized**: Layout designed for 21:9 and 32:9 aspect ratios
- **Responsive Design**: Adapts to various screen sizes

## 🛠️ Hardware Requirements

- **Raspberry Pi 4 or 5** (recommended for smooth performance)
- **Large curved/ultra-wide monitor** (21:9, 32:9, or standard 16:9 works too)
- **8GB+ SD Card** for Raspberry Pi OS
- **Keyboard/Mouse** for initial setup (optional after configuration)

## 📋 Prerequisites

- Raspberry Pi OS (Bullseye or newer)
- Python 3.7+
- Internet connection (for weather data and news feeds)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
cd ~
git clone https://github.com/olino3/star-wars-dashboard.git
cd star-wars-dashboard
```

### 2. Run the Installer

```bash
chmod +x setup.sh
./setup.sh
```

The installer will:
- Install system dependencies (Python, Chromium, etc.)
- Set up a Python virtual environment
- Install Python packages
- Create a systemd service for auto-start
- Configure kiosk mode
- Optionally configure weather API

### 3. Test the Dashboard

```bash
# The service should auto-start, but you can test it manually:
chromium-browser http://localhost:5000
```

### 4. Enable Kiosk Mode on Boot

Kiosk mode is automatically configured! Just reboot:

```bash
sudo reboot
```

The dashboard will launch full-screen on startup.

## ⚙️ Configuration

### Weather API (Optional but Recommended)

To get real weather data instead of mock data:

1. Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api)
2. Create a `.env` file in the project root:

```bash
OPENWEATHER_API_KEY=your_api_key_here
WEATHER_LOCATION=London
```

3. Restart the service:

```bash
sudo systemctl restart kuat-systems-dashboard.service
```

### Customize Update Intervals

Edit `frontend/js/app.js` and modify these values (in milliseconds):

```javascript
this.chronoInterval = 1000;      // Chronometer: 1 second
this.systemInterval = 5000;      // System stats: 5 seconds
this.weatherInterval = 300000;   // Weather: 5 minutes
this.newsInterval = 600000;      // News: 10 minutes
```

### Customize Screensaver Timeout

Edit `frontend/js/screensaver.js`:

```javascript
this.timeout = 600000;  // 10 minutes in milliseconds
```

### Add Custom News Sources

Edit `backend/app.py` and modify the `RSS_FEEDS` list or the `api_news()` function to add your own RSS feeds or custom news sources.

## 🗂️ Project Structure

```
star-wars-dashboard/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── requirements.txt       # Python dependencies
│   └── utils/
│       ├── system_stats.py    # System monitoring
│       └── weather.py         # Weather data fetching
├── frontend/
│   ├── index.html            # Main dashboard HTML
│   ├── css/
│   │   ├── main.css          # Core styles
│   │   └── animations.css    # Animations & effects
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── screensaver.js    # Hyperspace screensaver
│   │   └── bounty_tracker.js # Bounty tracking module
│   └── fonts/                # Star Wars fonts (add your own)
├── config/
│   ├── autostart.desktop     # Autostart configuration
│   └── launch-kiosk.sh       # Kiosk mode launcher (created by setup.sh)
├── setup.sh                  # Installation script
└── README.md                 # This file
```

## 🎨 Adding Star Wars Fonts

For the best experience, download Star Wars fonts like "Star Jedi" or "Aurebesh":

1. Download fonts from [DaFont](https://www.dafont.com/star-jedi.font) or similar
2. Place `.ttf` files in `frontend/fonts/`
3. Update `frontend/css/main.css`:

```css
@font-face {
    font-family: 'StarJedi';
    src: url('../fonts/Starjedi.ttf') format('truetype');
}

.logo-text {
    font-family: 'StarJedi', monospace;
}
```

## 🐛 Troubleshooting

### Dashboard doesn't start on boot

Check if the service is running:

```bash
sudo systemctl status kuat-systems-dashboard.service
```

View logs:

```bash
sudo journalctl -u kuat-systems-dashboard.service -f
```

### Weather data not updating

1. Verify your API key is correct in `.env`
2. Check the backend logs for API errors
3. Test the API endpoint manually:

```bash
curl http://localhost:5000/api/weather
```

### Screensaver not activating

1. Check browser console for JavaScript errors (F12)
2. Ensure you're not moving the mouse/keyboard
3. Default timeout is 10 minutes - test with a shorter value

### Performance issues on Raspberry Pi

1. Reduce update intervals in `frontend/js/app.js`
2. Disable CRT flicker effect in `frontend/css/main.css`:

```css
.crt-flicker {
    display: none;  /* Disable for better performance */
}
```

3. Reduce screensaver stars:

```javascript
// In frontend/js/screensaver.js
this.numStars = 100;  // Reduce from 200
```

## 🔧 Manual Control

### Start/Stop the Backend Service

```bash
sudo systemctl start kuat-systems-dashboard.service
sudo systemctl stop kuat-systems-dashboard.service
sudo systemctl restart kuat-systems-dashboard.service
```

### Launch Kiosk Mode Manually

```bash
./config/launch-kiosk.sh
```

### Disable Auto-Start

```bash
sudo systemctl disable kuat-systems-dashboard.service
rm ~/.config/autostart/kuat-systems-dashboard.desktop
```

## 🌐 API Endpoints

The backend exposes these REST API endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main dashboard page |
| `GET /api/system` | System statistics (CPU, RAM, Disk) |
| `GET /api/weather` | Weather/atmospheric data |
| `GET /api/chronometer` | Current time (Kuat Systems Standard + Earth) |
| `GET /api/bounty/scan` | Bounty hunter target scan |
| `GET /api/news` | HoloNet news feed |
| `GET /health` | Service health check |

## 🎯 Future Enhancements

- [ ] Real RSS feed integration for Star Wars news
- [ ] Multiple screensaver modes (Death Star schematics, star field)
- [ ] Network monitoring (show active devices as "Fleet Status")
- [ ] Smart home integration (control lights as "Reactor Controls")
- [ ] Voice commands (via Google Assistant/Alexa)
- [ ] Multiple themes (Imperial, Rebel Alliance, Mandalorian)
- [ ] Data persistence (historical charts)

## 🤝 Contributing

Feel free to fork this project and submit pull requests! Some ideas:

- Add new screensaver animations
- Improve theme customization
- Add new data modules
- Optimize performance
- Create alternative themes

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## ⚡ Credits

Created for Star Wars fans and Raspberry Pi enthusiasts.

**May the Force be with you, Commander!** 🌟

## 📞 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the backend logs: `sudo journalctl -u kuat-systems-dashboard.service -f`
3. Open an issue on GitHub with:
   - Your Raspberry Pi model
   - OS version (`cat /etc/os-release`)
   - Error messages/logs

## 🎬 Screenshots

### Main Dashboard View
Full tactical overview with all systems operational.

### Bounty Hunter Tracking
Active scan showing detected targets with threat levels.

### Hyperspace Screensaver
Immersive hyperspace animation during idle periods.

---

**Built with ❤️ for Kuat Systems Engineering**

*This is a fan project and is not affiliated with or endorsed by Lucasfilm Ltd. or Disney.*
