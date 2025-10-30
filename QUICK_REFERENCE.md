# Quick Reference: Backend API Updates

## 🆕 New Admin Endpoints

### Admin Reports Management

```bash
# List all reports with pagination and filters
GET /api/admin/reports?page=1&limit=20&status=pending&userId=xxx&startDate=2025-01-01&endDate=2025-12-31

# Get single report details
GET /api/admin/reports/:reportId

# Update report status and add admin notes
PUT /api/admin/reports/:reportId
Body: {
  "status": "approved",  // pending, reviewed, approved, rejected
  "adminNotes": "Great work this week!"
}

# Get report statistics
GET /api/admin/reports/stats/summary?startDate=2025-01-01&endDate=2025-12-31&userId=xxx
```

### Admin Quotations Management

```bash
# List all quotations with pagination and filters
GET /api/admin/quotations?page=1&limit=20&status=pending&urgency=high&userId=xxx&responded=false&search=hospital

# Get single quotation details
GET /api/admin/quotations/:quotationId

# Respond to quotation request (sends emails automatically)
PUT /api/admin/quotations/:quotationId/respond
Body: {
  "response": "We can provide this equipment",
  "quotationDocument": "https://cloudinary.com/...",
  "estimatedCost": 250000,
  "isAvailable": true,
  "price": 250000,
  "availableDate": "2025-02-15",
  "notes": "Delivery within 2 weeks"
}

# Update quotation status
PUT /api/admin/quotations/:quotationId
Body: {
  "status": "completed"  // pending, in_progress, responded, completed, rejected
}

# Get quotation statistics
GET /api/admin/quotations/stats/summary?startDate=2025-01-01&endDate=2025-12-31&userId=xxx
```

---

## 📝 Updated Schemas

### Report Status Values
```javascript
// OLD: ['pending', 'approved', 'rejected']
// NEW: ['pending', 'reviewed', 'approved', 'rejected']
```

### Quotation Status Values
```javascript
// OLD: ['pending', 'responded']
// NEW: ['pending', 'in_progress', 'responded', 'completed', 'rejected']
```

### Visit Client Types
```javascript
// OLD: ['hospital', 'clinic', 'dispensary', 'pharmacy', 'laboratory', 'other']
// NEW: ['hospital', 'clinic', 'pharmacy', 'lab', 'imaging_center', 'other']
```

### Visit Purpose Values
```javascript
// OLD: ['routine_visit', 'follow_up', 'demo', 'service', 'complaint', 'order', 'other']
// NEW: ['demo', 'followup', 'installation', 'maintenance', 'consultation', 'sales', 'other']
```

### Visit Outcome Values
```javascript
// OLD: ['successful', 'partial', 'no_access', 'rescheduled', 'cancelled']
// NEW: ['successful', 'pending', 'followup_required', 'no_interest']
```

### Contact Roles
```javascript
// OLD: ['doctor', 'nurse', 'lab_technician', 'pharmacist', 'administrator', 'procurement', 'other']
// NEW: ['doctor', 'nurse', 'admin', 'procurement', 'it_manager', 'ceo', 'other']
```

---

## 📧 Email Notifications

### Automatic Email Triggers

1. **New Report Submitted**
   - **Trigger:** Non-draft report created via `POST /api/reports`
   - **Recipient:** Admin (from `ADMIN_EMAIL` env variable)
   - **Template:** `newReport`
   - **Contains:** Author, week range, report URL, PDF download link

2. **New Quotation Requested**
   - **Trigger:** Quotation created via `POST /api/quotation`
   - **Recipient:** Admin
   - **Template:** `newQuotation`
   - **Contains:** Hospital, equipment, urgency, contact details, requester

3. **Quotation Response Sent**
   - **Trigger:** Admin responds via `PUT /api/admin/quotations/:id/respond`
   - **Recipients:** 
     - Sales rep who created the request
     - Client (if contactEmail provided)
   - **Template:** `quotationResponse`
   - **Contains:** Response details, estimated cost, document link

---

## 🔐 Access Control

### Admin/Manager Only Endpoints
- All `/api/admin/reports/*` routes
- All `/api/admin/quotations/*` routes

### Authentication Required
- All report endpoints (except download with proper permissions)
- All quotation endpoints
- All visit endpoints

---

## ⚠️ Breaking Changes

### Visit API
- ⚠️ `client.type` enum values changed - update mobile app
- ⚠️ `visitPurpose` enum values changed - update mobile app
- ⚠️ `visitOutcome` enum values changed - update mobile app
- ⚠️ `contacts.role` enum values changed - update mobile app

**Migration:** Existing data with old enum values will still work, but new submissions must use updated values.

### Quotation API
- ⚠️ `contactEmail` is now optional (was required before)
- ⚠️ New status values added - UI should handle all 5 statuses

### Report API
- ⚠️ New status value `'reviewed'` added - UI should handle all 4 statuses

---

## 🧪 Testing Examples

### Test Report Submission with Validation

```bash
# This should FAIL (missing required sections)
POST /api/reports
{
  "weekStart": "2025-01-15",
  "weekEnd": "2025-01-19",
  "isDraft": false,
  "content": {
    "metadata": {
      "author": "John Doe",
      "submittedAt": "2025-01-19T17:30:00Z",
      "weekRange": "1/15/2025 - 1/19/2025"
    },
    "sections": [
      {
        "id": "summary",
        "title": "Weekly Summary",
        "content": "This week I focused on..."
      }
      // Missing: visits, quotations, next-week sections
    ]
  }
}

Response: 400 Bad Request
{
  "success": false,
  "message": "Required sections missing",
  "errors": [
    "Section 'visits' is required",
    "Section 'quotations' is required",
    "Section 'next-week' is required"
  ]
}
```

### Test Admin Quotation Response

```bash
# Admin responds to quotation
PUT /api/admin/quotations/12345/respond
Authorization: Bearer <admin-token>
{
  "response": "We can provide the X-Ray machine",
  "estimatedCost": 2500000,
  "quotationDocument": "https://cloudinary.com/quotations/quote-12345.pdf",
  "availableDate": "2025-02-15",
  "notes": "Includes installation and training"
}

Response: 200 OK
{
  "success": true,
  "message": "Response sent successfully",
  "data": {
    "_id": "12345",
    "status": "responded",
    "responded": true,
    "response": {
      "message": "We can provide the X-Ray machine",
      "estimatedCost": 2500000,
      "documentUrl": "https://cloudinary.com/quotations/quote-12345.pdf",
      "respondedBy": { ... },
      "respondedAt": "2025-01-20T10:00:00Z"
    }
    // ... other fields
  }
}

// Emails automatically sent to:
// 1. Sales rep who created the request
// 2. Client (if contactEmail was provided)
```

---

## 🌐 Environment Variables Checklist

```bash
# Required for email notifications to work
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="ACCORD Medical <noreply@accordmedical.com>"

# Required for admin notifications
ADMIN_EMAIL=admin@accordmedical.com

# Required for email links to work
APP_URL=https://app.codewithseth.co.ke
```

---

## 📱 Mobile App Updates Needed

### Update Enum Values in App

**Visit Creation Form:**
```javascript
// Update client type options
const clientTypes = ['hospital', 'clinic', 'pharmacy', 'lab', 'imaging_center', 'other'];

// Update visit purpose options
const visitPurposes = ['demo', 'followup', 'installation', 'maintenance', 'consultation', 'sales', 'other'];

// Update visit outcome options
const visitOutcomes = ['successful', 'pending', 'followup_required', 'no_interest'];

// Update contact role options
const contactRoles = ['doctor', 'nurse', 'admin', 'procurement', 'it_manager', 'ceo', 'other'];
```

**Quotation Status Display:**
```javascript
// Update status badge colors
const quotationStatusColors = {
  'pending': 'orange',
  'in_progress': 'blue',
  'responded': 'green',
  'completed': 'success',
  'rejected': 'red'
};
```

**Report Status Display:**
```javascript
// Update status badge colors
const reportStatusColors = {
  'pending': 'orange',
  'reviewed': 'blue',
  'approved': 'green',
  'rejected': 'red'
};
```

---

## ✅ Deployment Checklist

- [ ] Update environment variables in production
- [ ] Test email delivery (SMTP credentials)
- [ ] Verify Cloudinary uploads work
- [ ] Test all admin endpoints
- [ ] Update mobile app with new enum values
- [ ] Test email notifications (check spam folders)
- [ ] Verify PDF generation works in production
- [ ] Test admin report review flow
- [ ] Test admin quotation response flow
- [ ] Monitor logs for errors

---

## 🐛 Troubleshooting

### Emails Not Sending
1. Check `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` are set
2. Verify SMTP credentials are correct
3. Check server logs for email errors
4. Test email service independently

### PDF Generation Fails
1. Check `/tmp` directory permissions
2. Verify Cloudinary credentials
3. Check report content structure
4. Look for errors in logs

### Admin Endpoints Return 403
1. Verify user has `admin` or `manager` role
2. Check JWT token is valid
3. Confirm `authorize` middleware is working

---

**Last Updated:** October 30, 2025  
**Version:** 2.0.0
