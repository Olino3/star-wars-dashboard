#!/bin/bash

# ============================================
# Kuat Systems Dashboard - Uninstall Script
# Removes autostart, kiosk mode, and services
# ============================================

echo "╔═══════════════════════════════════════════╗"
echo "║  KUAT SYSTEMS DASHBOARD UNINSTALLER       ║"
echo "║  Decommissioning Tactical Station...      ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Get current directory
INSTALL_DIR=$(pwd)

echo "⚠️  This will remove:"
echo "   - The systemd service (kuat-systems-dashboard.service)"
echo "   - The autostart desktop entry"
echo "   - The kiosk launcher script"
echo ""
echo "   It will NOT remove:"
echo "   - The project files"
echo "   - The Python virtual environment"
echo "   - Your .env configuration"
echo ""
read -p "Are you sure you want to uninstall? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Uninstall cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping and disabling systemd service..."
if systemctl is-active --quiet kuat-systems-dashboard.service 2>/dev/null; then
    sudo systemctl stop kuat-systems-dashboard.service
    echo "   ✓ Service stopped"
fi

if systemctl is-enabled --quiet kuat-systems-dashboard.service 2>/dev/null; then
    sudo systemctl disable kuat-systems-dashboard.service
    echo "   ✓ Service disabled"
fi

if [ -f /etc/systemd/system/kuat-systems-dashboard.service ]; then
    sudo rm /etc/systemd/system/kuat-systems-dashboard.service
    sudo systemctl daemon-reload
    echo "   ✓ Service file removed"
else
    echo "   ℹ️  Service file not found (already removed)"
fi

echo ""
echo "🖥️  Removing autostart configuration..."
AUTOSTART_FILE="$HOME/.config/autostart/kuat-systems-dashboard.desktop"
if [ -f "$AUTOSTART_FILE" ]; then
    rm "$AUTOSTART_FILE"
    echo "   ✓ Autostart entry removed"
else
    echo "   ℹ️  Autostart entry not found (already removed)"
fi

echo ""
echo "📜 Removing kiosk launcher script..."
KIOSK_SCRIPT="$INSTALL_DIR/config/launch-kiosk.sh"
if [ -f "$KIOSK_SCRIPT" ]; then
    rm "$KIOSK_SCRIPT"
    echo "   ✓ Kiosk launcher removed"
else
    echo "   ℹ️  Kiosk launcher not found (already removed)"
fi

echo ""
read -p "🗑️  Do you also want to remove the Python virtual environment? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "$INSTALL_DIR/venv" ]; then
        rm -rf "$INSTALL_DIR/venv"
        echo "   ✓ Virtual environment removed"
    else
        echo "   ℹ️  Virtual environment not found"
    fi
fi

echo ""
read -p "🔑 Do you also want to remove the .env configuration file? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "$INSTALL_DIR/.env" ]; then
        rm "$INSTALL_DIR/.env"
        echo "   ✓ .env file removed"
    else
        echo "   ℹ️  .env file not found"
    fi
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  UNINSTALL COMPLETE!                      ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "✅ The Kuat Systems Dashboard has been decommissioned."
echo ""
echo "The following items remain (remove manually if desired):"
echo "   - Project files in: $INSTALL_DIR"
if [ -d "$INSTALL_DIR/venv" ]; then
    echo "   - Virtual environment: $INSTALL_DIR/venv"
fi
if [ -f "$INSTALL_DIR/.env" ]; then
    echo "   - Configuration: $INSTALL_DIR/.env"
fi
echo ""
echo "To completely remove, run:"
echo "   rm -rf $INSTALL_DIR"
echo ""
echo "May the Force be with you, Commander! 🌟"
