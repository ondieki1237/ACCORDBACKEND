#!/bin/bash

# Simple All-Services Starter
# Starts both Python API and Node.js backend

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting ACCORD Services..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}⚠️  Shutting down...${NC}"
    jobs -p | xargs -r kill 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start Python API
echo -e "${GREEN}1️⃣  Starting Python Analytics API (Port 5001)${NC}"
cd "$SCRIPT_DIR/analytics"
source venv/bin/activate
python api_server.py > python-api.log 2>&1 &
PYTHON_PID=$!
cd "$SCRIPT_DIR"

# Wait for Python API to start (up to 30 seconds)
echo -e "${YELLOW}   ⏳ Waiting for Python API to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Python API is running${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ❌ Python API failed to start (timeout)${NC}"
        echo -e "${YELLOW}   Check logs: analytics/python-api.log${NC}"
        kill $PYTHON_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""

# Start Node.js
echo -e "${GREEN}2️⃣  Starting Node.js Backend (Port 4500)${NC}"
cd "$SCRIPT_DIR/project"
npm run dev &
NODE_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All services started!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🌐 Services:"
echo "   • Python API:  http://localhost:5001"
echo "   • Node.js API: http://localhost:4500"
echo ""
echo "🔍 Test:"
echo "   curl http://localhost:5001/health"
echo "   curl http://localhost:4500/api/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait
wait
