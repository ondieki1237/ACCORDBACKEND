#!/bin/bash

# Deployment script for production server
# Usage: ./deploy-to-production.sh

echo "🚀 Starting deployment to production..."

# SSH to production server and execute commands
ssh root@app.codewithseth.co.ke << 'ENDSSH'
  echo "📦 Navigating to project directory..."
  cd /root/ACCORDBACKEND || exit 1
  
  echo "🔄 Pulling latest changes from Git..."
  git pull origin main
  
  echo "📋 Checking if MPESA_USE_TEST_PHONE is set..."
  if ! grep -q "MPESA_USE_TEST_PHONE" project/.env; then
    echo "➕ Adding MPESA_USE_TEST_PHONE=false to .env..."
    echo "MPESA_USE_TEST_PHONE=false" >> project/.env
  else
    echo "✅ MPESA_USE_TEST_PHONE already exists in .env"
  fi
  
  echo "📦 Installing dependencies (if any new)..."
  cd project && npm install --production
  
  echo "🔄 Restarting PM2 service..."
  pm2 restart accord-backend
  
  echo "✅ Deployment complete!"
  echo ""
  echo "📊 Server status:"
  pm2 list
  
  echo ""
  echo "📝 Recent logs (last 20 lines):"
  pm2 logs accord-backend --lines 20 --nostream
ENDSSH

echo ""
echo "✅ Deployment finished! Check logs above for confirmation."
echo "📝 To watch live logs, run: ssh root@app.codewithseth.co.ke 'pm2 logs accord-backend'"
