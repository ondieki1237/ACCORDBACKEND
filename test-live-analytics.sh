#!/bin/bash

# Quick test script for live analytics

echo "🧪 Testing Live Analytics API..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test Python API directly
echo "1. Testing Python API (Port 5001)..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}✓ Python API is running${NC}"
    curl -s http://localhost:5001/health | python3 -m json.tool
else
    echo -e "${RED}✗ Python API is not running${NC}"
    echo "   Start it with: cd analytics && ./start-api.sh"
fi

echo ""

# Test Node.js backend
echo "2. Testing Node.js Backend (Port 4500)..."
if curl -s http://localhost:4500/api/health > /dev/null; then
    echo -e "${GREEN}✓ Node.js Backend is running${NC}"
    curl -s http://localhost:4500/api/health | python3 -m json.tool
else
    echo -e "${RED}✗ Node.js Backend is not running${NC}"
    echo "   Start it with: cd project && npm run dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if curl -s http://localhost:5001/health > /dev/null && curl -s http://localhost:4500/api/health > /dev/null; then
    echo -e "${GREEN}✓ All services are running!${NC}"
    echo ""
    echo "To test with authentication, use:"
    echo ""
    echo "  curl http://localhost:4500/api/analytics/live/realtime \\"
    echo "    -H \"Authorization: Bearer YOUR_TOKEN\""
    echo ""
    echo "Available endpoints:"
    echo "  • /api/analytics/live/realtime        - Today's stats"
    echo "  • /api/analytics/live/summary         - Performance summary"
    echo "  • /api/analytics/live/dashboard       - Complete dashboard"
    echo "  • /api/analytics/live/conversion      - Conversion funnel"
    echo "  • /api/analytics/live/regional        - Regional performance"
    echo "  • /api/analytics/live/top-performers  - Top performers"
    echo "  • /api/analytics/live/chart/:type     - Live charts"
else
    echo -e "${YELLOW}⚠ Some services are not running${NC}"
    echo ""
    echo "Start all services with:"
    echo "  ./start-all.sh"
fi

echo ""
