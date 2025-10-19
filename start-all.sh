#!/bin/bash

# Quick Start Script - Starts both Node.js and Python services

echo "🚀 Starting ACCORD Backend Services..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Check if required directories exist
if [ ! -d "project" ] || [ ! -d "analytics" ]; then
    echo -e "${RED}✗ Error: project or analytics directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Starting Services...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}⚠ Shutting down services...${NC}"
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python Analytics API
echo -e "${GREEN}1. Starting Python Analytics API (Port 5001)...${NC}"
cd "$SCRIPT_DIR/analytics"
chmod +x start-api.sh
./start-api.sh &
PYTHON_PID=$!
cd "$SCRIPT_DIR"

# Wait for Python API to be ready
echo -e "${YELLOW}   Waiting for Python API to be ready...${NC}"
sleep 5

# Check if Python API is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}   ✓ Python API is running${NC}"
else
    echo -e "${RED}   ✗ Python API failed to start${NC}"
    kill $PYTHON_PID 2>/dev/null
    exit 1
fi

echo ""

# Start Node.js Backend
echo -e "${GREEN}2. Starting Node.js Backend (Port 4500)...${NC}"
cd "$SCRIPT_DIR/project"
npm run dev &
NODE_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Service URLs:"
echo "  🌐 Node.js Backend:    http://localhost:4500"
echo "  📊 Python Analytics:   http://localhost:5001"
echo ""
echo "Health Checks:"
echo "  curl http://localhost:4500/api/health"
echo "  curl http://localhost:5001/health"
echo ""
echo "Live Analytics Endpoints:"
echo "  GET http://localhost:4500/api/analytics/live/realtime"
echo "  GET http://localhost:4500/api/analytics/live/dashboard"
echo "  GET http://localhost:4500/api/analytics/live/summary"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for both processes
wait
