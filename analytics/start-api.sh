#!/bin/bash

# Start Python Analytics API Server
# This script starts the persistent Flask server

echo "🚀 Starting Python Analytics API Server..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Check if we're in the analytics directory
if [ ! -f "api_server.py" ]; then
    echo -e "${RED}✗ Error: api_server.py not found${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠ Virtual environment not found. Running setup...${NC}"
    ./setup.sh
fi

# Activate virtual environment
echo -e "${GREEN}✓ Activating virtual environment...${NC}"
source venv/bin/activate

# Install Flask dependencies if not already installed
echo -e "${GREEN}✓ Checking dependencies...${NC}"
pip install flask flask-cors --quiet

# Check if .env exists
if [ ! -f "../project/.env" ]; then
    echo -e "${RED}✗ Error: .env file not found in project directory${NC}"
    exit 1
fi

# Get port from environment or use default
ANALYTICS_PORT=${ANALYTICS_PORT:-5001}

echo -e "${GREEN}✓ Starting Flask server on port ${ANALYTICS_PORT}...${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Analytics API Server"
echo "  🌐 URL: http://localhost:${ANALYTICS_PORT}"
echo "  📡 Health Check: http://localhost:${ANALYTICS_PORT}/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Available Endpoints:"
echo "  GET  /health                           - Health check"
echo "  GET  /api/analytics/live/summary       - Live sales summary"
echo "  GET  /api/analytics/live/dashboard     - Complete dashboard"
echo "  GET  /api/analytics/live/realtime      - Real-time stats"
echo "  GET  /api/analytics/live/conversion    - Conversion funnel"
echo "  GET  /api/analytics/live/regional      - Regional performance"
echo "  GET  /api/analytics/live/top-performers - Top performers"
echo "  GET  /api/analytics/live/predictions   - ML predictions"
echo "  GET  /api/analytics/live/users-activity - User activity"
echo "  GET  /api/analytics/live/chart/:type   - Live charts"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the Flask server
python api_server.py
