#!/bin/bash

# MongoDB to MySQL Daily Backup Cron Setup
# This script sets up a cron job to run the backup at midnight daily

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_DIR="$PROJECT_DIR/logs"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Create the cron job command
CRON_CMD="0 0 * * * cd $PROJECT_DIR && /usr/bin/node src/scripts/sync-to-mysql.js >> $LOG_DIR/mysql-backup.log 2>&1"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        MongoDB → MySQL Backup Cron Setup                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Project Directory: $PROJECT_DIR"
echo "Log File: $LOG_DIR/mysql-backup.log"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "sync-to-mysql.js"; then
    echo "⚠️  Cron job already exists. Updating..."
    # Remove existing job
    crontab -l 2>/dev/null | grep -v "sync-to-mysql.js" | crontab -
fi

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "Schedule: Daily at midnight (00:00)"
echo ""
echo "To view current cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove this cron job:"
echo "  crontab -l | grep -v 'sync-to-mysql.js' | crontab -"
echo ""
echo "To run manually:"
echo "  cd $PROJECT_DIR && node src/scripts/sync-to-mysql.js"
echo ""

# Show current crontab
echo "Current crontab entries:"
echo "─────────────────────────────────────────────────────────────────"
crontab -l 2>/dev/null || echo "(empty)"
