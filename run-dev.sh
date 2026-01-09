#!/bin/bash

# ============================================
# Development Server Runner
# Quick start for testing without full setup
# ============================================

echo "🚀 Starting Kuat Systems Dashboard (Development Mode)"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r backend/requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  No .env file found. Using mock weather data."
    echo "   To use real weather, create a .env file with:"
    echo "   OPENWEATHER_API_KEY=your_key"
    echo "   WEATHER_LOCATION=your_city"
    echo ""
else
    echo "📄 Loading environment variables from .env..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start the server
echo "🌟 Starting backend server..."
echo "   Dashboard: http://localhost:5000"
echo "   Press Ctrl+C to stop"
echo ""

cd backend
python app.py
