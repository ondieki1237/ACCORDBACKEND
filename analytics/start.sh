#!/bin/bash

# Simple Python API Starter
# Run from anywhere

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Starting Python Analytics API..."

# Check virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first"
    exit 1
fi

# Activate venv and start server
source venv/bin/activate

# Check dependencies
if ! python -c "import flask" 2>/dev/null; then
    echo "📦 Installing Flask dependencies..."
    pip install flask flask-cors --quiet
fi

# Get port
ANALYTICS_PORT=${ANALYTICS_PORT:-5001}

echo "✅ Starting Flask server on port $ANALYTICS_PORT"
echo ""
echo "Available at:"
echo "  • http://localhost:$ANALYTICS_PORT"
echo "  • Health: http://localhost:$ANALYTICS_PORT/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
python api_server.py
