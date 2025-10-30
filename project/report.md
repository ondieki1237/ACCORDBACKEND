# Backend API Updates for Sections-Based Reports

## 🎯 Overview
This document outlines the backend changes needed to support the new **sections-based report structure** while maintaining backward compatibility with existing Cloudinary file uploads.

---

## 📊 Current vs New Data Structure

### Current API Response (File-Based)
```json
{
  "success": true,
  "data": [
    {
      "_id": "report123",
      "userId": {
        "_id": "user123",
        "firstName": "Seth",
        "lastName": "Makori",
        "email": "bellarinseth@gmail.com"
      },
      "weekStart": "2025-10-06T00:00:00.000Z",
      "weekEnd": "2025-10-12T23:59:59.999Z",
      "status": "pending",
      "createdAt": "2025-10-12T17:30:00.000Z",
      
      // FILE-BASED (Current)
      "report": "report text",
      "filePath": "/uploads/report.pdf",
      "fileName": "weekly-report.pdf",
      "fileUrl": "https://res.cloudinary.com/...",
      "filePublicId": "cloudinary-id"
    }
  ]
}
```

### Enhanced API Response (Sections-Based)
```json
{
  "success": true,
  "data": [
    {
      "_id": "report123",
      "userId": {
        "_id": "user123",
        "firstName": "Seth",
        "lastName": "Makori",
        "email": "bellarinseth@gmail.com"
      },
      "weekStart": "2025-10-06T00:00:00.000Z",
      "weekEnd": "2025-10-12T23:59:59.999Z",
      "weekRange": "06/10/2025 - 12/10/2025",  // ✨ NEW
      "status": "pending",
      "createdAt": "2025-10-12T17:30:00.000Z",
      
      // SECTIONS-BASED (New)
      "sections": [                              // ✨ NEW
        {
          "id": "summary",
          "title": "Weekly Summary",
          "content": "This week I focused on expanding our client base..."
        },
        {
          "id": "visits",
          "title": "Customer Visits",
          "content": "1. Nairobi General Hospital - Demo\n2. Kenyatta Hospital - Follow-up"
        },
        {
          "id": "quotations",
          "title": "Quotations Generated",
          "content": "• X-Ray Machine - KES 1,200,000\n• Ultrasound - KES 800,000"
        },
        {
          "id": "leads",
          "title": "New Leads",
          "content": "• Kisumu Hospital - Imaging equipment"
        },
        {
          "id": "challenges",
          "title": "Challenges Faced",
          "content": "Budget freeze delays at some hospitals..."
        },
        {
          "id": "nextWeek",
          "title": "Next Week's Plan",
          "content": "• Follow up on 3 quotations\n• Schedule 2 demos"
        }
      ],
      
      // FILE-BASED (Optional - for backward compatibility)
      "fileUrl": "https://res.cloudinary.com/...",  // Optional
      "filePath": "/uploads/report.pdf",             // Optional
      "fileName": "weekly-report.pdf"                // Optional
    }
  ]
}
```

---

## 🗄️ Database Schema Updates

### MongoDB Schema (Mongoose Example)

```javascript
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Date fields
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  weekRange: {
    type: String,  // ✨ NEW: Pre-formatted display string
    // Example: "06/10/2025 - 12/10/2025"
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: null
  },
  
  // ✨ NEW: Sections-based content
  sections: [{
    id: {
      type: String,
      required: true
      // Common values: 'summary', 'visits', 'quotations', 'leads', 'challenges', 'nextWeek'
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  }],
  
  // Legacy/Optional: File-based fields (for backward compatibility)
  report: String,
  filePath: String,
  fileName: String,
  fileUrl: String,
  filePublicId: String,
  
  // Legacy: Old metadata structure (deprecated but supported)
  weeklySummary: String,
  visits: [{
    hospital: String,
    clientName: String,
    purpose: String,
    outcome: String,
    notes: String
  }],
  quotations: [{
    clientName: String,
    equipment: String,
    amount: Number,
    status: String
  }],
  newLeads: [{
    name: String,
    interest: String,
    notes: String
  }],
  challenges: String,
  nextWeekPlan: String
  
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Report', ReportSchema);
```

---

## 🔌 API Endpoints to Update

### 1. GET `/api/reports` - List All Reports

**Current Implementation** - No changes needed! ✅

The frontend already handles both structures, so the API just needs to return what's in the database.

```javascript
router.get('/reports', authenticate, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

### 2. POST `/api/reports` - Create New Report

**Need to Update** - Accept `sections` and `weekRange` fields

```javascript
router.post('/reports', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { weekStart, weekEnd, weekRange, sections } = req.body;
    
    // Parse sections if it's a JSON string
    let parsedSections = null;
    if (sections) {
      parsedSections = typeof sections === 'string' 
        ? JSON.parse(sections) 
        : sections;
    }
    
    // Create report object
    const reportData = {
      userId: req.user._id,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      weekRange, // ✨ NEW
      sections: parsedSections, // ✨ NEW
      status: 'pending'
    };
    
    // Handle file upload (if present)
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'reports',
        resource_type: 'auto'
      });
      
      reportData.fileUrl = result.secure_url;
      reportData.filePublicId = result.public_id;
      reportData.fileName = req.file.originalname;
      reportData.filePath = req.file.path;
    }
    
    const report = new Report(reportData);
    await report.save();
    
    // Populate user info for response
    await report.populate('userId', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

### 3. PUT `/api/reports/:id` - Update Report

**Need to Update** - Allow updating `sections` and `weekRange`

```javascript
router.put('/reports/:id', authenticate, async (req, res) => {
  try {
    const { weekStart, weekEnd, weekRange, sections } = req.body;
    
    // Parse sections if it's a JSON string
    let parsedSections = null;
    if (sections) {
      parsedSections = typeof sections === 'string' 
        ? JSON.parse(sections) 
        : sections;
    }
    
    const updateData = {
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      weekRange, // ✨ NEW
      sections: parsedSections // ✨ NEW
    };
    
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');
    
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## 📱 Mobile App Changes

### Report Submission Form

The mobile app needs to send the new structure:

```javascript
// Mobile app - Submit report
const submitReport = async (reportData) => {
  const formData = new FormData();
  
  // Date fields
  formData.append('weekStart', reportData.weekStart);
  formData.append('weekEnd', reportData.weekEnd);
  formData.append('weekRange', reportData.weekRange); // ✨ NEW
  
  // ✨ NEW: Sections data
  formData.append('sections', JSON.stringify([
    {
      id: 'summary',
      title: 'Weekly Summary',
      content: reportData.summary
    },
    {
      id: 'visits',
      title: 'Customer Visits',
      content: reportData.visits
    },
    {
      id: 'quotations',
      title: 'Quotations Generated',
      content: reportData.quotations
    },
    {
      id: 'leads',
      title: 'New Leads',
      content: reportData.leads
    },
    {
      id: 'challenges',
      title: 'Challenges Faced',
      content: reportData.challenges
    },
    {
      id: 'nextWeek',
      title: "Next Week's Plan",
      content: reportData.nextWeekPlan
    }
  ]));
  
  // Optional: File attachment
  if (reportData.file) {
    formData.append('file', reportData.file);
  }
  
  const response = await fetch('https://app.codewithseth.co.ke/api/reports', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};
```

---

## 🔄 Migration Strategy

### Phase 1: Add Support (No Breaking Changes)

1. **Update Database Schema**
   - Add `sections` and `weekRange` fields (optional)
   - Keep all existing fields

2. **Update API Endpoints**
   - Accept new fields in POST/PUT requests
   - Return all fields in GET requests
   - Don't require new fields (optional)

3. **Deploy Backend**
   - Old reports continue to work
   - New reports can use sections structure
   - No mobile app changes required yet

### Phase 2: Encourage New Structure

1. **Update Mobile App**
   - Add sections-based form
   - Keep file upload as optional
   - Generate `weekRange` automatically

2. **User Training**
   - Show benefits (better display, analytics)
   - Provide templates for sections
   - Allow both methods initially

### Phase 3: Migrate Old Reports (Optional)

1. **Create Migration Script**

```javascript
// Migration script to convert old reports to sections
const migrateReports = async () => {
  const reports = await Report.find({ sections: { $exists: false } });
  
  for (const report of reports) {
    const sections = [];
    
    // Convert legacy fields to sections
    if (report.weeklySummary) {
      sections.push({
        id: 'summary',
        title: 'Weekly Summary',
        content: report.weeklySummary
      });
    }
    
    if (report.visits && report.visits.length > 0) {
      const visitsContent = report.visits
        .map((v, i) => `${i + 1}. ${v.hospital || v.clientName} - ${v.purpose}`)
        .join('\n');
      sections.push({
        id: 'visits',
        title: 'Customer Visits',
        content: visitsContent
      });
    }
    
    // ... convert other fields
    
    if (sections.length > 0) {
      report.sections = sections;
      
      // Generate weekRange
      const start = new Date(report.weekStart);
      const end = new Date(report.weekEnd);
      report.weekRange = `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`;
      
      await report.save();
      console.log(`Migrated report ${report._id}`);
    }
  }
};
```

---

## ✅ Testing Checklist

### Backend API Tests

- [ ] POST `/api/reports` with sections data
- [ ] POST `/api/reports` with file only (legacy)
- [ ] POST `/api/reports` with both sections and file
- [ ] GET `/api/reports` returns sections correctly
- [ ] PUT `/api/reports/:id` updates sections
- [ ] Sections validation (empty content, missing fields)
- [ ] WeekRange format validation

### Integration Tests

- [ ] Mobile app can submit sections-based reports
- [ ] Admin panel displays sections correctly
- [ ] PDF generation includes all sections
- [ ] Legacy reports still display properly
- [ ] Status updates work with new structure

### Data Validation

```javascript
// Validation middleware
const validateReportSections = (req, res, next) => {
  const { sections } = req.body;
  
  if (sections) {
    const parsed = typeof sections === 'string' 
      ? JSON.parse(sections) 
      : sections;
    
    // Validate structure
    if (!Array.isArray(parsed)) {
      return res.status(400).json({
        success: false,
        message: 'Sections must be an array'
      });
    }
    
    // Validate each section
    for (const section of parsed) {
      if (!section.id || !section.title || !section.content) {
        return res.status(400).json({
          success: false,
          message: 'Each section must have id, title, and content'
        });
      }
    }
  }
  
  next();
};

// Use in route
router.post('/reports', authenticate, validateReportSections, async (req, res) => {
  // ... create report
});
```

---

## 🚨 Important Notes

### 1. Backward Compatibility
- **Keep all existing fields** in the database
- Old reports with only file URLs will still work
- Frontend handles both structures automatically

### 2. Optional Fields
- `sections` is **optional** - reports can still use files
- `weekRange` is **optional** - frontend will format from dates if missing
- File uploads are **optional** - reports can be sections-only

### 3. Data Priority
If a report has both structures, the frontend will:
1. Display `sections` if available (preferred)
2. Fall back to legacy metadata if no sections
3. Show "No content" if neither exists
4. Always show file download if available

### 4. Performance
- Sections are stored as array in single document (efficient)
- No additional database calls needed
- Indexed queries on userId, status, createdAt

---

## 📊 Summary

### What Needs to Change

✅ **Database Schema**: Add `sections` and `weekRange` fields (optional)
✅ **POST /api/reports**: Accept and save sections data
✅ **PUT /api/reports/:id**: Allow updating sections
⚠️ **Mobile App**: Update to send sections structure (when ready)
✅ **Frontend**: Already updated and compatible!

### What Stays the Same

- GET /api/reports (no changes needed)
- File upload functionality
- Authentication and authorization
- Status update endpoints
- All existing reports continue to work

### Migration Path

1. **Deploy backend** with new fields (optional)
2. **Test with manual API calls** to verify
3. **Update mobile app** to use sections
4. **Monitor** - both old and new formats work
5. **Migrate old reports** (optional, when ready)

Your admin panel is **already ready** for the new structure! 🎉
