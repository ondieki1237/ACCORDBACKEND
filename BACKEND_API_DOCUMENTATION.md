# Backend API Documentation - Reports & Data Submission

## Overview
This document describes the backend API endpoints and admin panel requirements for handling sales reports, quotations, and client visits submitted from the ACCORD sales application.

---

## 📋 Table of Contents
1. [Weekly Reports API](#weekly-reports-api)
2. [Visits API](#visits-api) 
3. [Quotations API](#quotations-api)
4. [Engineering Services API](#engineering-services-api)
5. [Admin Panel Requirements](#admin-panel-requirements)
6. [Database Schemas](#database-schemas)
7. [PDF Generation](#pdf-generation)
8. [Email Notifications](#email-notifications)

---

## 1. Weekly Reports API

### Endpoint: `POST /api/reports`

**Purpose**: Sales reps submit weekly activity reports

**Authentication**: Required (Bearer token)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Request Body Schema**:
```json
{
  "weekStart": "2025-01-15",
  "weekEnd": "2025-01-19",
  "content": {
    "metadata": {
      "author": "John Doe",
      "submittedAt": "2025-01-19T17:30:00.000Z",
      "weekRange": "1/15/2025 - 1/19/2025"
    },
    "sections": [
      {
        "id": "summary",
        "title": "Weekly Summary",
        "content": "This week I focused on following up with leads from last month..."
      },
      {
        "id": "visits",
        "title": "Customer Visits",
        "content": "Visited 5 hospitals:\n1. Nairobi General Hospital...\n2. Kenyatta National Hospital..."
      },
      {
        "id": "quotations",
        "title": "Quotations Generated",
        "content": "Generated 3 quotations totaling KES 2.5M:\n- X-Ray Machine for..."
      },
      {
        "id": "leads",
        "title": "New Leads",
        "content": "Identified 4 new potential clients..."
      },
      {
        "id": "challenges",
        "title": "Challenges Faced",
        "content": "Faced delays in getting meetings with procurement teams..."
      },
      {
        "id": "next-week",
        "title": "Next Week's Plan",
        "content": "Plan to follow up on pending quotations..."
      }
    ]
  },
  "isDraft": false
}
```

**Field Descriptions**:
- `weekStart` (required): ISO date string for week start (typically Monday)
- `weekEnd` (required): ISO date string for week end (typically Friday)
- `content.metadata`:
  - `author`: Full name of the sales rep
  - `submittedAt`: ISO timestamp of submission
  - `weekRange`: Human-readable date range
- `content.sections`: Array of report sections
  - `id`: Unique section identifier
  - `title`: Section heading
  - `content`: Section text content (can be multi-line)
- `isDraft` (optional): Boolean indicating if this is a draft or final submission

**Response** (Success - 201 Created):
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "_id": "report_abc123",
    "userId": "user_xyz789",
    "weekStart": "2025-01-15",
    "weekEnd": "2025-01-19",
    "content": { ...},
    "isDraft": false,
    "pdfUrl": null,
    "status": "pending",
    "createdAt": "2025-01-19T17:30:00.000Z",
    "updatedAt": "2025-01-19T17:30:00.000Z"
  }
}
```

**Response** (Error - 400 Bad Request):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "weekStart is required",
    "weekEnd must be after weekStart",
    "Section 'summary' content is required"
  ]
}
```

**Response** (Error - 401 Unauthorized):
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Backend Implementation** (Node.js/Express):
```javascript
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { authenticate } = require('../middleware/auth');
const { generateReportPDF } = require('../utils/pdfGenerator');

router.post('/', authenticate, async (req, res) => {
  try {
    const { weekStart, weekEnd, content, isDraft } = req.body;

    // Validation
    if (!weekStart || !weekEnd) {
      return res.status(400).json({
        success: false,
        message: 'weekStart and weekEnd are required'
      });
    }

    if (new Date(weekEnd) <= new Date(weekStart)) {
      return res.status(400).json({
        success: false,
        message: 'weekEnd must be after weekStart'
      });
    }

    // Validate required sections
    const requiredSections = ['summary', 'visits', 'quotations', 'next-week'];
    const missingSections = requiredSections.filter(id => {
      const section = content.sections.find(s => s.id === id);
      return !section || !section.content.trim();
    });

    if (!isDraft && missingSections.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Required sections missing',
        errors: missingSections.map(id => `Section '${id}' is required`)
      });
    }

    // Create report
    const report = new Report({
      userId: req.user._id,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      content,
      isDraft: isDraft || false,
      status: 'pending',
      pdfUrl: null
    });

    await report.save();

    // Generate PDF asynchronously (don't block response)
    if (!isDraft) {
      generateReportPDF(report._id).catch(err => {
        console.error('PDF generation failed:', err);
      });
    }

    // Populate user data for response
    await report.populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });

  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
});

module.exports = router;
```

---

## 2. Visits API

### Endpoint: `POST /api/visits`

**Purpose**: Sales reps record client visits/planners

**Authentication**: Required (Bearer token)

**Request Body Schema**:
```json
{
  "date": "2025-01-20T09:00:00.000Z",
  "startTime": "2025-01-20T09:00:00.000Z",
  "client": {
    "name": "Nairobi General Hospital",
    "type": "hospital",
    "location": "Nairobi, Kenya"
  },
  "visitPurpose": "demo",
  "visitOutcome": "successful",
  "contacts": [
    {
      "name": "Dr. Jane Smith",
      "role": "procurement",
      "phone": "+254712345678",
      "email": "jane.smith@ngh.co.ke"
    }
  ],
  "isFollowUpRequired": true
}
```

**Field Descriptions**:
- `date` (required): ISO timestamp of visit date
- `startTime` (required): ISO timestamp of visit start time
- `client` (required):
  - `name`: Client/facility name
  - `type`: Client type (hospital, clinic, pharmacy, lab, imaging_center, other)
  - `location`: Physical location/address
- `visitPurpose` (required): Purpose code (demo, followup, installation, maintenance, consultation, sales, other)
- `visitOutcome` (optional): Outcome code (successful, pending, followup_required, no_interest)
- `contacts` (optional): Array of contact persons met during visit
  - `name`: Contact person's name
  - `role`: Role/title (doctor, nurse, admin, procurement, it_manager, ceo, other)
  - `phone`: Contact phone number
  - `email`: Contact email
- `isFollowUpRequired` (optional): Boolean indicating if follow-up is needed

**Response** (Success - 201 Created):
```json
{
  "success": true,
  "message": "Visit recorded successfully",
  "data": {
    "_id": "visit_abc123",
    "userId": "user_xyz789",
    "date": "2025-01-20T09:00:00.000Z",
    "startTime": "2025-01-20T09:00:00.000Z",
    "client": { ... },
    "visitPurpose": "demo",
    "visitOutcome": "successful",
    "contacts": [ ... ],
    "isFollowUpRequired": true,
    "createdAt": "2025-01-20T09:15:00.000Z",
    "updatedAt": "2025-01-20T09:15:00.000Z"
  }
}
```

**Backend Implementation**:
```javascript
router.post('/', authenticate, async (req, res) => {
  try {
    const { date, startTime, client, visitPurpose, visitOutcome, contacts, isFollowUpRequired } = req.body;

    // Validation
    if (!date || !startTime || !client || !visitPurpose) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    if (!client.name || !client.type || !client.location) {
      return res.status(400).json({
        success: false,
        message: 'Client name, type, and location are required'
      });
    }

    // Create visit
    const visit = new Visit({
      userId: req.user._id,
      date: new Date(date),
      startTime: new Date(startTime),
      client,
      visitPurpose,
      visitOutcome: visitOutcome || 'pending',
      contacts: contacts || [],
      isFollowUpRequired: isFollowUpRequired || false
    });

    await visit.save();
    await visit.populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Visit recorded successfully',
      data: visit
    });

  } catch (error) {
    console.error('Visit creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record visit'
    });
  }
});
```

---

## 3. Quotations API

### Endpoint: `POST /api/quotation`

**Purpose**: Sales reps request product quotations for clients

**Authentication**: Required (Bearer token)

**Request Body Schema**:
```json
{
  "hospital": "Nairobi General Hospital",
  "location": "Nairobi, Kenya",
  "equipmentRequired": "X-Ray Machine Model 500",
  "urgency": "high",
  "contactName": "Dr. Jane Smith",
  "contactEmail": "jane.smith@ngh.co.ke",
  "contactPhone": "+254712345678"
}
```

**Field Descriptions**:
- `hospital` (required): Client/facility name
- `location` (required): Client location/address
- `equipmentRequired` (required): Product/equipment description
- `urgency` (required): Urgency level (low, medium, high)
- `contactName` (required): Client contact person
- `contactEmail` (optional): Client email
- `contactPhone` (required): Client phone number

**Response** (Success - 201 Created):
```json
{
  "success": true,
  "message": "Quotation request submitted successfully",
  "data": {
    "_id": "quot_abc123",
    "userId": "user_xyz789",
    "hospital": "Nairobi General Hospital",
    "location": "Nairobi, Kenya",
    "equipmentRequired": "X-Ray Machine Model 500",
    "urgency": "high",
    "contactName": "Dr. Jane Smith",
    "contactEmail": "jane.smith@ngh.co.ke",
    "contactPhone": "+254712345678",
    "status": "pending",
    "responded": false,
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**Backend Implementation**:
```javascript
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      hospital,
      location,
      equipmentRequired,
      urgency,
      contactName,
      contactEmail,
      contactPhone
    } = req.body;

    // Validation
    if (!hospital || !location || !equipmentRequired || !urgency || !contactName || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    if (!['low', 'medium', 'high'].includes(urgency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid urgency level. Must be: low, medium, or high'
      });
    }

    // Create quotation request
    const quotation = new Quotation({
      userId: req.user._id,
      hospital,
      location,
      equipmentRequired,
      urgency,
      contactName,
      contactEmail: contactEmail || '',
      contactPhone,
      status: 'pending',
      responded: false
    });

    await quotation.save();
    await quotation.populate('userId', 'firstName lastName email phone');

    // Send notification to admin (optional)
    sendQuotationNotification(quotation).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Quotation request submitted successfully',
      data: quotation
    });

  } catch (error) {
    console.error('Quotation submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quotation request'
    });
  }
});
```

---

## 4. Engineering Services API

See `BACKEND_REQUIREMENTS.md` for detailed engineering services API documentation.

---

## 5. Admin Panel Requirements

### Dashboard Overview

The admin panel should provide:

1. **Reports Management**
   - List all submitted weekly reports
   - Filter by: date range, sales rep, status
   - View report details
   - Download report as PDF
   - Mark reports as reviewed

2. **Visits Management**
   - Calendar view of all scheduled/completed visits
   - List view with filters
   - Export visits data
   - View client visit history

3. **Quotations Management**
   - List all quotation requests
   - Filter by: urgency, status, date, sales rep
   - Respond to quotation requests
   - Attach quotation documents
   - Mark as responded/completed

4. **Engineering Services**
   - Assign services to engineers
   - Track service status
   - View service reports

### Admin API Endpoints

#### GET `/api/admin/reports`
```javascript
router.get('/reports', authenticate, isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.weekStart = {};
      if (startDate) query.weekStart.$gte = new Date(startDate);
      if (endDate) query.weekStart.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDocs = await Report.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.json({
      success: true,
      data: {
        docs: reports,
        totalDocs,
        totalPages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});
```

#### GET `/api/admin/reports/:id`
```javascript
router.get('/reports/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Fetch report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report'
    });
  }
});
```

#### PUT `/api/admin/reports/:id`
```javascript
router.put('/reports/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report'
    });
  }
});
```

#### PUT `/api/admin/quotations/:id/respond`
```javascript
router.put('/quotations/:id/respond', authenticate, isAdmin, async (req, res) => {
  try {
    const { response, quotationDocument, estimatedCost } = req.body;

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        responded: true,
        status: 'responded',
        response: {
          message: response,
          documentUrl: quotationDocument,
          estimatedCost,
          respondedBy: req.user._id,
          respondedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Send notification to sales rep
    sendQuotationResponseNotification(quotation).catch(console.error);

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: quotation
    });

  } catch (error) {
    console.error('Respond to quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to quotation'
    });
  }
});
```

---

## 6. Database Schemas

### Report Schema (MongoDB/Mongoose)
```javascript
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekStart: {
    type: Date,
    required: true,
    index: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  content: {
    metadata: {
      author: String,
      submittedAt: Date,
      weekRange: String
    },
    sections: [{
      id: String,
      title: String,
      content: String
    }]
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  pdfUrl: String,
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ userId: 1, weekStart: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
```

### Visit Schema
```javascript
const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: Date,
  client: {
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['hospital', 'clinic', 'pharmacy', 'lab', 'imaging_center', 'other'],
      required: true
    },
    location: { type: String, required: true }
  },
  visitPurpose: {
    type: String,
    enum: ['demo', 'followup', 'installation', 'maintenance', 'consultation', 'sales', 'other'],
    required: true
  },
  visitOutcome: {
    type: String,
    enum: ['successful', 'pending', 'followup_required', 'no_interest']
  },
  contacts: [{
    name: String,
    role: {
      type: String,
      enum: ['doctor', 'nurse', 'admin', 'procurement', 'it_manager', 'ceo', 'other']
    },
    phone: String,
    email: String
  }],
  isFollowUpRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

visitSchema.index({ userId: 1, date: -1 });
visitSchema.index({ 'client.name': 'text', 'client.location': 'text' });

module.exports = mongoose.model('Visit', visitSchema);
```

### Quotation Schema
```javascript
const quotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hospital: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  equipmentRequired: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    index: true
  },
  contactName: {
    type: String,
    required: true
  },
  contactEmail: String,
  contactPhone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'responded', 'completed', 'rejected'],
    default: 'pending',
    index: true
  },
  responded: {
    type: Boolean,
    default: false,
    index: true
  },
  response: {
    message: String,
    documentUrl: String,
    estimatedCost: Number,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

quotationSchema.index({ userId: 1, createdAt: -1 });
quotationSchema.index({ urgency: 1, status: 1 });
quotationSchema.index({ hospital: 'text', equipmentRequired: 'text' });

module.exports = mongoose.model('Quotation', quotationSchema);
```

---

## 7. PDF Generation

### Report PDF Generator

**Library**: puppeteer or pdfkit

**Implementation Example**:
```javascript
const puppeteer = require('puppeteer');
const Report = require('../models/Report');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function generateReportPDF(reportId) {
  try {
    const report = await Report.findById(reportId)
      .populate('userId', 'firstName lastName email phone');

    if (!report) {
      throw new Error('Report not found');
    }

    // Generate HTML template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #00aeef; margin-bottom: 10px; }
          .metadata { background: #f5f5f5; padding: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section h2 { color: #333; border-bottom: 2px solid #00aeef; padding-bottom: 10px; }
          .section-content { padding: 15px; white-space: pre-wrap; }
          .footer { text-align: center; margin-top: 50px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Weekly Sales Report</h1>
          <p>${report.content.metadata.weekRange}</p>
        </div>

        <div class="metadata">
          <p><strong>Submitted by:</strong> ${report.content.metadata.author}</p>
          <p><strong>Email:</strong> ${report.userId.email}</p>
          <p><strong>Phone:</strong> ${report.userId.phone}</p>
          <p><strong>Submitted on:</strong> ${new Date(report.content.metadata.submittedAt).toLocaleString()}</p>
        </div>

        ${report.content.sections.map(section => `
          <div class="section">
            <h2>${section.title}</h2>
            <div class="section-content">${section.content}</div>
          </div>
        `).join('')}

        <div class="footer">
          <p>ACCORD Medical - Sales Report System</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Upload to S3 or save locally
    const fileName = `reports/${reportId}_${Date.now()}.pdf`;
    
    // Option 1: Upload to S3
    const uploadResult = await s3.upload({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'private'
    }).promise();

    // Update report with PDF URL
    await Report.findByIdAndUpdate(reportId, {
      pdfUrl: uploadResult.Location
    });

    console.log(`PDF generated successfully: ${uploadResult.Location}`);
    return uploadResult.Location;

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

module.exports = { generateReportPDF };
```

---

## 8. Email Notifications

### Admin Notification (New Report Submitted)
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendNewReportNotification(report) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `New Weekly Report Submitted - ${report.content.metadata.author}`,
      html: `
        <h2>New Weekly Report</h2>
        <p><strong>From:</strong> ${report.content.metadata.author}</p>
        <p><strong>Week:</strong> ${report.content.metadata.weekRange}</p>
        <p><strong>Submitted:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
        <p><a href="${process.env.APP_URL}/admin/reports/${report._id}">View Report</a></p>
        ${report.pdfUrl ? `<p><a href="${report.pdfUrl}">Download PDF</a></p>` : ''}
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification sent to admin');

  } catch (error) {
    console.error('Email notification error:', error);
  }
}

async function sendQuotationNotification(quotation) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `New Quotation Request - ${quotation.hospital} (${quotation.urgency} priority)`,
      html: `
        <h2>New Quotation Request</h2>
        <p><strong>Hospital:</strong> ${quotation.hospital}</p>
        <p><strong>Location:</strong> ${quotation.location}</p>
        <p><strong>Equipment:</strong> ${quotation.equipmentRequired}</p>
        <p><strong>Urgency:</strong> <span style="color: ${quotation.urgency === 'high' ? 'red' : quotation.urgency === 'medium' ? 'orange' : 'green'}">${quotation.urgency.toUpperCase()}</span></p>
        <p><strong>Contact:</strong> ${quotation.contactName} (${quotation.contactPhone})</p>
        <p><strong>Requested by:</strong> ${quotation.userId.firstName} ${quotation.userId.lastName}</p>
        <p><a href="${process.env.APP_URL}/admin/quotations/${quotation._id}">Respond to Request</a></p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Quotation notification sent to admin');

  } catch (error) {
    console.error('Email notification error:', error);
  }
}

module.exports = {
  sendNewReportNotification,
  sendQuotationNotification
};
```

---

## Summary

This documentation covers:

✅ **Reports API** - Complete endpoint documentation with validation
✅ **Visits API** - Planner/visit recording endpoint
✅ **Quotations API** - Product quotation requests endpoint
✅ **Admin Panel Requirements** - What admins need to manage data
✅ **Database Schemas** - MongoDB/Mongoose models
✅ **PDF Generation** - Automatic PDF creation for reports
✅ **Email Notifications** - Alert admins of new submissions

All endpoints follow the same pattern as your existing visit creation flow, with:
- Bearer token authentication
- JSON request/response format
- Proper validation and error handling
- Offline support consideration
- Admin management capabilities

The backend should handle these submissions, store them in the database, generate PDFs, and notify admins for review and response.
