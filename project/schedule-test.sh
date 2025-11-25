#!/bin/bash

# Schedule weekly report test for 9:53 PM EAT today
# This will run once and then remove itself

SCRIPT_DIR="/home/seth/Documents/fine/ACCORDBACKEND/project"
LOG_FILE="/tmp/weekly-report-test-$(date +%Y%m%d).log"

echo "Scheduling weekly report test for 9:53 PM EAT (21:53)..."
echo "Log file: $LOG_FILE"

# Add to crontab
(crontab -l 2>/dev/null; echo "53 21 25 11 * cd $SCRIPT_DIR && node test-weekly-report.js >> $LOG_FILE 2>&1") | crontab -

echo "✅ Scheduled successfully!"
echo ""
echo "The report will run at 9:53 PM tonight and send emails to:"
echo "  - bellarinseth@gmail.com"
echo "  - reports@accordmedical.co.ke"
echo ""
echo "To check the log after it runs:"
echo "  cat $LOG_FILE"
echo ""
echo "To remove the scheduled job after it runs:"
echo "  crontab -e"
echo "  (delete the line with 'test-weekly-report.js')"
