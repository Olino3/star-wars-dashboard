#!/bin/bash

# ============================================
# Galactic Command Dashboard - Setup Script
# For Raspberry Pi with Debian/Raspberry Pi OS
# ============================================

set -e  # Exit on error

echo "╔═══════════════════════════════════════════╗"
echo "║  GALACTIC COMMAND DASHBOARD INSTALLER     ║"
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
    chromium-browser \
    unclutter \
    x11-xserver-utils \
    git

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
sudo tee /etc/systemd/system/galactic-dashboard.service > /dev/null <<EOF
[Unit]
Description=Galactic Command Dashboard Backend
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
sudo systemctl enable galactic-dashboard.service
sudo systemctl start galactic-dashboard.service

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 3

# Check service status
if sudo systemctl is-active --quiet galactic-dashboard.service; then
    echo "✅ Dashboard service is running!"
else
    echo "❌ Dashboard service failed to start. Check logs with:"
    echo "   sudo journalctl -u galactic-dashboard.service -f"
fi

# Setup autostart directory
echo "⚙️  Setting up autostart configuration..."
AUTOSTART_DIR="$HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

# Create autostart desktop entry
cat > "$AUTOSTART_DIR/galactic-dashboard.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Galactic Command Dashboard
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

# Launch Chromium in kiosk mode
chromium-browser \
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

# Optional: Configure weather API key
echo ""
echo "🌍 Weather Configuration (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To get real weather data, you need an OpenWeatherMap API key."
echo "Get one free at: https://openweathermap.org/api"
echo ""
read -p "Do you want to configure weather now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your OpenWeatherMap API key: " API_KEY
    read -p "Enter your location (e.g., London, New York): " LOCATION

    # Create environment file
    cat > "$INSTALL_DIR/.env" <<EOF
OPENWEATHER_API_KEY=$API_KEY
WEATHER_LOCATION=$LOCATION
EOF

    # Update systemd service to use .env file
    sudo sed -i '/\[Service\]/a EnvironmentFile='$INSTALL_DIR'/.env' /etc/systemd/system/galactic-dashboard.service
    sudo systemctl daemon-reload
    sudo systemctl restart galactic-dashboard.service

    echo "✅ Weather configuration saved!"
else
    echo "ℹ️  Skipping weather configuration. Dashboard will use mock data."
fi

# Final instructions
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  INSTALLATION COMPLETE!                   ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "🎉 Your Galactic Command Dashboard is ready!"
echo ""
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Test the dashboard now:"
echo "   chromium-browser http://localhost:5000"
echo ""
echo "2. Enable kiosk mode on boot (optional):"
echo "   The dashboard will auto-start in kiosk mode on next boot."
echo ""
echo "3. Manually start/stop the backend service:"
echo "   sudo systemctl start galactic-dashboard.service"
echo "   sudo systemctl stop galactic-dashboard.service"
echo ""
echo "4. View backend logs:"
echo "   sudo journalctl -u galactic-dashboard.service -f"
echo ""
echo "5. To launch kiosk mode manually:"
echo "   ./config/launch-kiosk.sh"
echo ""
echo "📝 For more information, check README.md"
echo ""
echo "May the Force be with you, Commander! 🌟"
