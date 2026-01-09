#!/bin/bash

# ============================================
# Kuat Systems Dashboard - Setup Script
# For Raspberry Pi with Debian/Raspberry Pi OS
# ============================================

set -e  # Exit on error

echo "╔═══════════════════════════════════════════╗"
echo "║  KUAT SYSTEMS DASHBOARD INSTALLER         ║"
echo "║  Configuring your Tactical Station...     ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠  WARNING: This doesn't appear to be a Raspberry Pi."
    echo "   The installer will continue, but some features may not work correctly."
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    unclutter \
    x11-xserver-utils \
    git

# Install Chromium (try 'chromium' first, then 'chromium-browser' as fallback)
echo "📦 Installing Chromium browser..."
if apt-cache show chromium > /dev/null 2>&1; then
    sudo apt-get install -y chromium
elif apt-cache show chromium-browser > /dev/null 2>&1; then
    sudo apt-get install -y chromium-browser
else
    echo "⚠️  WARNING: Could not find chromium or chromium-browser package."
    echo "   Please install Chromium manually."
fi

# Create virtual environment
echo "🐍 Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# Get current directory
INSTALL_DIR=$(pwd)

# Create systemd service for auto-start
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/kuat-systems-dashboard.service > /dev/null <<EOF
[Unit]
Description=Kuat Systems Dashboard Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
Environment="PATH=$INSTALL_DIR/venv/bin"
ExecStart=$INSTALL_DIR/venv/bin/python $INSTALL_DIR/backend/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "🚀 Enabling dashboard service..."
sudo systemctl daemon-reload
sudo systemctl enable kuat-systems-dashboard.service
sudo systemctl start kuat-systems-dashboard.service

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 3

# Check service status
if sudo systemctl is-active --quiet kuat-systems-dashboard.service; then
    echo "✅ Dashboard service is running!"
else
    echo "❌ Dashboard service failed to start. Check logs with:"
    echo "   sudo journalctl -u kuat-systems-dashboard.service -f"
fi

# Setup autostart directory
echo "⚙️  Setting up autostart configuration..."
AUTOSTART_DIR="$HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

# Create autostart desktop entry
cat > "$AUTOSTART_DIR/kuat-systems-dashboard.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Kuat Systems Dashboard
Comment=Launch dashboard in kiosk mode
Exec=$INSTALL_DIR/config/launch-kiosk.sh
Terminal=false
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Create kiosk launch script
echo "🖥️  Creating kiosk mode launcher..."
cat > "$INSTALL_DIR/config/launch-kiosk.sh" <<'EOF'
#!/bin/bash

# Wait for X server to be ready
sleep 10

# Hide mouse cursor after inactivity
unclutter -idle 0.1 &

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Wait for backend to be ready
while ! curl -s http://localhost:5000/health > /dev/null; do
    echo "Waiting for backend to start..."
    sleep 2
done

# Detect Chromium binary (chromium or chromium-browser)
if command -v chromium &> /dev/null; then
    CHROMIUM_BIN="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROMIUM_BIN="chromium-browser"
else
    echo "ERROR: Chromium not found. Please install chromium or chromium-browser."
    exit 1
fi

# Launch Chromium in kiosk mode
$CHROMIUM_BIN \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --disable-session-crashed-bubble \
    --disable-features=TranslateUI \
    --disable-translate \
    --incognito \
    http://localhost:5000
EOF

chmod +x "$INSTALL_DIR/config/launch-kiosk.sh"

# Environment Configuration
echo ""
echo "⚙️  Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONFIGURE_ENV=false

if [ -f "$INSTALL_DIR/.env" ]; then
    echo "✅ Existing .env file found!"
    read -p "Do you want to reconfigure the environment variables? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        CONFIGURE_ENV=true
    fi
else
    echo "No .env file found. Let's configure your environment variables."
    CONFIGURE_ENV=true
fi

if [ "$CONFIGURE_ENV" = true ]; then
    echo ""
    echo "🌍 Weather Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "To get real weather data, you need an OpenWeatherMap API key."
    echo "Get one free at: https://openweathermap.org/api"
    echo "(Press Enter to skip and use mock data)"
    echo ""
    read -p "Enter your OpenWeatherMap API key: " OPENWEATHER_API_KEY
    read -p "Enter your weather location (e.g., London, New York): " WEATHER_LOCATION

    echo ""
    echo "🚇 Subway/Transit Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Configure your nearest subway station for real-time arrival times."
    echo "For NYC, find station IDs at: http://web.mta.info/developers/data/nyct/subway/Stations.csv"
    echo "(Press Enter to skip and use mock data)"
    echo ""
    read -p "Enter subway city (e.g., NYC): " SUBWAY_CITY
    read -p "Enter subway station ID (e.g., D17 for 7th Ave-53rd St, 65 for Grand Central): " SUBWAY_STATION_ID

    echo ""
    echo "📺 YouTube Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "To display YouTube feed data, you need a YouTube Data API v3 key."
    echo "Get one at: https://console.cloud.google.com/apis/credentials"
    echo "(Press Enter to skip)"
    echo ""
    read -p "Enter your YouTube API key: " YOUTUBE_API_KEY

    # Create environment file
    cat > "$INSTALL_DIR/.env" <<EOF
OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
WEATHER_LOCATION="$WEATHER_LOCATION"
SUBWAY_CITY=$SUBWAY_CITY
SUBWAY_STATION_ID=$SUBWAY_STATION_ID
YOUTUBE_API_KEY=$YOUTUBE_API_KEY
EOF

    # Update systemd service to use .env file if not already configured
    if ! grep -q "EnvironmentFile" /etc/systemd/system/kuat-systems-dashboard.service 2>/dev/null; then
        sudo sed -i '/\[Service\]/a EnvironmentFile='$INSTALL_DIR'/.env' /etc/systemd/system/kuat-systems-dashboard.service
    fi

    sudo systemctl daemon-reload
    sudo systemctl restart kuat-systems-dashboard.service

    echo ""
    echo "✅ Environment configuration saved to .env!"
else
    echo "ℹ️  Keeping existing .env configuration."
fi

# Final instructions
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  INSTALLATION COMPLETE!                   ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "🎉 Your Kuat Systems Dashboard is ready!"
echo ""
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Test the dashboard now:"
echo "   chromium http://localhost:5000  (or chromium-browser on older systems)"
echo ""
echo "2. Enable kiosk mode on boot (optional):"
echo "   The dashboard will auto-start in kiosk mode on next boot."
echo ""
echo "3. Manually start/stop the backend service:"
echo "   sudo systemctl start kuat-systems-dashboard.service"
echo "   sudo systemctl stop kuat-systems-dashboard.service"
echo ""
echo "4. View backend logs:"
echo "   sudo journalctl -u kuat-systems-dashboard.service -f"
echo ""
echo "5. To launch kiosk mode manually:"
echo "   ./config/launch-kiosk.sh"
echo ""
echo "📝 For more information, check README.md"
echo ""
echo "May the Force be with you, Commander! 🌟"
