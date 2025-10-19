#!/bin/bash

# ACCORD Medical Analytics Setup Script
# This script sets up the Python analytics environment

echo "======================================"
echo "ACCORD Medical Analytics Setup"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python found: $(python3 --version)"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "To use the analytics framework:"
echo ""
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Run comprehensive analytics:"
echo "   python main.py"
echo ""
echo "3. Or run for custom time period (e.g., 60 days):"
echo "   python main.py 60"
echo ""
echo "4. When done, deactivate:"
echo "   deactivate"
echo ""
echo "Reports will be saved in the 'reports/' directory"
echo ""
