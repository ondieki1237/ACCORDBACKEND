#!/bin/bash

# Setup Analytics for ACCORD Backend
# This script ensures analytics are ready to be served via API

echo "=========================================="
echo "ACCORD Analytics API Setup"
echo "=========================================="
echo ""

# Check if analytics directory exists
if [ ! -d "../analytics" ]; then
    echo "❌ Analytics directory not found!"
    echo "Please ensure the analytics folder exists at: ../analytics"
    exit 1
fi

echo "✓ Analytics directory found"

# Check if Python venv exists
if [ ! -d "../analytics/venv" ]; then
    echo "⚠️  Python virtual environment not found"
    echo "Setting up Python environment..."
    
    cd ../analytics
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ../project
    
    echo "✓ Python environment created"
else
    echo "✓ Python virtual environment found"
fi

# Create reports directory if it doesn't exist
if [ ! -d "../analytics/reports" ]; then
    echo "Creating reports directory..."
    mkdir -p ../analytics/reports
    echo "✓ Reports directory created"
else
    echo "✓ Reports directory exists"
fi

# Test Python analytics
echo ""
echo "Testing Python analytics connection..."
cd ../analytics
source venv/bin/activate
python -c "from database import AccordDatabase; db = AccordDatabase(); print('✓ Database connection successful'); db.close()" 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Analytics are ready!"
else
    echo "⚠️  Database connection test failed"
    echo "Please check your MongoDB URI in project/.env"
fi

cd ../project

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Analytics API Endpoints:"
echo "  POST   /api/analytics/generate"
echo "  GET    /api/analytics/status"
echo "  GET    /api/analytics/dashboard"
echo "  GET    /api/analytics/visualizations"
echo "  GET    /api/analytics/report/latest"
echo "  GET    /api/analytics/files/:filename"
echo "  DELETE /api/analytics/cleanup"
echo ""
echo "Automatic Generation Schedule:"
echo "  Weekly:  Every Monday at 8:00 AM (7 days)"
echo "  Monthly: 1st of month at 7:00 AM (30 days)"
echo ""
echo "Start the backend server:"
echo "  npm run dev"
echo ""
