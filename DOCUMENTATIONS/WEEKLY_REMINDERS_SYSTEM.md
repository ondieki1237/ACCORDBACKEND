# Weekly Reminders System

## Overview

The weekly reminders system automatically sends emails to sales team members on specific days to remind them about their reporting and planning duties.

## Reminders Configured

### 1. **Weekly Report Reminder**
- **When**: Every Friday at 5:00 PM (EAT)
- **Who**: Non-admin users who haven't submitted their weekly report
- **Message**: Reminds users to submit their weekly report before end of business
- **Includes**: Tips on what should be in the report (visits, quotations, leads, challenges, next week plans)

### 2. **Weekly Planner Reminder**
- **When**: Every Sunday at 5:00 PM (EAT)
- **Who**: Non-admin users who haven't filled their weekly planner
- **Message**: Reminds users to complete their weekly planner for the upcoming week
- **Includes**: Tips on what should be in the planner (locations, meetings, prospects, allowances, transportation)

## How It Works

### Report Reminder Logic
1. Checks all active non-admin users in the system
2. For each user, checks if they have submitted a non-draft weekly report for the current week (Monday - Sunday)
3. If no report is found, sends a friendly reminder email
4. Non-admin users are identified by `role !== 'admin'`

### Planner Reminder Logic
1. Checks all active non-admin users in the system
2. For each user, checks if they have filled a weekly planner for the current week (Monday - Sunday)
3. If no planner is found, sends a friendly reminder email
4. Uses `weekCreatedAt` field to match planners to the current week

## Technical Details

### Scheduling
- Built using **node-cron** library
- Cron expressions in UTC timezone:
  - Friday reminders: `0 17 * * 5` (5 PM EAT)
  - Sunday reminders: `0 17 * * 0` (5 PM EAT)

### Email Templates
- Custom HTML emails with:
  - User's first name personalization
  - Clear call-to-action
  - Helpful hints about what to submit
  - Professional styling with ACCORD branding

### Database Queries
- Uses MongoDB queries to find users and their submissions
- Efficient filtering to only query necessary documents
- Detailed logging for monitoring

## Configuration

### Environment Variables
The system uses existing email configuration:
```
EMAIL_HOST=your-email-host
EMAIL_PORT=your-email-port
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password
EMAIL_FROM=ACCORD Medical <noreply@accordmedical.com>
```

### Adjusting Times
If you need to change the reminder times:

**In `src/services/scheduledJobs.js`:**

```javascript
// Change these cron expressions:
// Format: minute hour day month weekday
// weekday: 0 = Sunday, 5 = Friday

// Friday at different time (e.g., 9 AM instead of 5 PM):
cron.schedule('0 9 * * 5', async () => { ... });

// Sunday at different time:
cron.schedule('0 14 * * 0', async () => { ... });
```

**Common Times (convert to your timezone):**
- 9 AM EAT = `0 9 * * X`
- 12 PM (Noon) EAT = `0 12 * * X`
- 3 PM EAT = `0 15 * * X`
- 5 PM EAT = `0 17 * * X`

## Testing

### Manual Test
Run the test script to manually trigger reminders:

```bash
# Test report reminders
node scripts/testReminders.js report

# Test planner reminders
node scripts/testReminders.js planner

# Test both
node scripts/testReminders.js both
```

### Monitoring
- Check server logs: logs in `logs/` directory
- Look for entries starting with:
  - `Running weekly report reminder job`
  - `Running weekly planner reminder job`
  - `Weekly report reminder sent to [email]`
  - `Weekly planner reminder sent to [email]`

## Email Content

### Weekly Report Reminder Subject
`📋 Weekly Report Reminder - Please Submit Today`

### Weekly Report Reminder Body
- Friendly greeting with user's name
- Clear statement that report hasn't been submitted
- Request to submit before end of business
- List of items to include in report:
  - Visits made and outcomes
  - Quotations generated
  - New leads captured
  - Challenges faced
  - Plans for next week
- Footer with app link

### Weekly Planner Reminder Subject
`📅 Weekly Planner Reminder - Please Fill Your Planner`

### Weekly Planner Reminder Body
- Friendly greeting with user's name
- Explanation that planner hasn't been filled
- Request to complete planner for the coming week
- List of items to include in planner:
  - Daily locations and travel plans
  - Scheduled visits and meetings
  - Expected prospects and outcomes
  - Travel allowance estimates
  - Transportation arrangements
- Note about importance of planning
- Footer with app link

## User Experience

### Who Receives Reminders?
- **Sales team members** (users with any role except 'admin')
- **Active users only** (isActive: true)
- **Those who haven't submitted** the required document for the current week

### Who Doesn't Receive Reminders?
- **Admins** (excluded by role check)
- **Inactive users** (not included in query)
- **Users who already submitted** for the current week

## Troubleshooting

### Reminders Not Sending
1. Check server is running
2. Verify database connection
3. Check email configuration in `.env` file
4. Review logs for error messages:
   ```
   Error in sendWeeklyReportReminders:
   Error in sendWeeklyPlannerReminders:
   ```

### Too Many/Too Few Emails
- Verify timezone setting (might be sending at different time than expected)
- Check user roles: make sure they're not 'admin'
- Check if users have already submitted reports/planners

### Email Content Issues
- Edit HTML templates in the reminder functions
- Test with `scripts/testReminders.js` after changes
- Check email formatting in different email clients

## Future Enhancements

Possible improvements:
1. Add admin dashboard to view reminder history
2. Allow customization of reminder times per user
3. Add option to snooze/dismiss reminders
4. Escalation reminders (multiple reminders if not submitted)
5. Detailed analytics on reminder effectiveness
6. SMS reminders as alternative/addition

## Related Functions

Located in `src/services/scheduledJobs.js`:
- `sendWeeklyReportReminders()` - Line ~170
- `sendWeeklyPlannerReminders()` - Line ~310
- `initializeScheduledJobs()` - Registers all scheduled jobs

Related Models:
- [Report.js](../src/models/Report.js) - Weekly reports
- [Planner.js](../src/models/Planner.js) - Weekly planners
- [User.js](../src/models/User.js) - User roles and status

Related Routes:
- `/api/reports/` - Report submission endpoints
- `/api/planner/` - Planner submission endpoints

---

**Last Updated**: March 6, 2026
**System**: ACCORD Medical - Field Sales Tracking System
