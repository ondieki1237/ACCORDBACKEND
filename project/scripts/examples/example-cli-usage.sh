#!/bin/bash
# PDF Generator CLI Usage Examples
# These are examples of how to use the PDF generator script

echo "========================================"
echo "PDF Generator - CLI Examples"
echo "========================================"

# Navigate to project root
cd "$(dirname "$(dirname "$(dirname "${BASH_SOURCE[0]}")")")"

echo ""
echo "Example 1: Basic usage - Generate from Machines API"
echo "Command:"
echo "  node scripts/pdf-generator.js --api=http://localhost:5000/api/machines"
echo ""
echo "Expected output: uploads/catalogs/product-catalog.pdf"
echo ""

echo "Example 2: Generate with custom filename"
echo "Command:"
echo "  node scripts/pdf-generator.js \\"
echo "    --api=http://localhost:5000/api/machines \\"
echo "    --output=medical-equipment.pdf"
echo ""
echo "Expected output: uploads/catalogs/medical-equipment.pdf"
echo ""

echo "Example 3: Generate with custom company name"
echo "Command:"
echo "  node scripts/pdf-generator.js \\"
echo "    --api=http://localhost:5000/api/machines \\"
echo "    --company='ACCORD Healthcare Systems'"
echo ""
echo "Expected output: uploads/catalogs/product-catalog.pdf (with custom company name)"
echo ""

echo "Example 4: All options combined"
echo "Command:"
echo "  node scripts/pdf-generator.js \\"
echo "    --api=http://localhost:5000/api/machines \\"
echo "    --output=full-catalog.pdf \\"
echo "    --company='My Company' \\"
echo "    --logo=other/Logo_only.png"
echo ""
echo "Expected output: uploads/catalogs/full-catalog.pdf (fully customized)"
echo ""

echo "Example 5: From external API"
echo "Command:"
echo "  node scripts/pdf-generator.js \\"
echo "    --api=https://external-api.com/api/products"
echo ""
echo "Expected output: uploads/catalogs/product-catalog.pdf"
echo ""

echo "========================================"
echo "To run any of these examples, uncomment the line below:"
echo "========================================"
echo ""

# Uncomment one of the examples below to run it:

# Example 1: Basic
# node scripts/pdf-generator.js --api=http://localhost:5000/api/machines

# Example 2: Custom filename
# node scripts/pdf-generator.js --api=http://localhost:5000/api/machines --output=medical-equipment.pdf

# Example 3: Custom company
# node scripts/pdf-generator.js --api=http://localhost:5000/api/machines --company="ACCORD Healthcare Systems"

# Example 4: All options
# node scripts/pdf-generator.js --api=http://localhost:5000/api/machines --output=full-catalog.pdf --company="My Company" --logo=other/Logo_only.png

# Example 5: External API
# node scripts/pdf-generator.js --api=https://api.example.com/products
