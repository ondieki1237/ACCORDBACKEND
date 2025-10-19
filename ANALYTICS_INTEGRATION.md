# Analytics API Integration - Complete Guide

## 🎯 Overview

The ACCORD backend now includes a **complete analytics API** that automatically generates Python-powered analytics and serves them to your frontend client. This allows you to display comprehensive business intelligence directly in your application.

## 🚀 What's New

### Backend Features

1. **REST API Endpoints** - 7 new endpoints to access analytics
2. **Automatic Generation** - Scheduled analytics every week and month
3. **Manual Triggers** - Generate analytics on-demand
4. **File Serving** - Serve charts, dashboards, and reports
5. **Email Notifications** - Admins notified when analytics are ready

### Files Added

```
project/src/
├── controllers/analyticsController.js  ✨ NEW - Analytics API logic
├── routes/analytics.js                  ✨ NEW - API endpoints
└── services/
    ├── scheduledJobs.js                 ✅ UPDATED - Added auto-generation
    └── emailService.js                  ✅ UPDATED - Analytics email template

project/
├── ANALYTICS_API.md                     ✨ NEW - API documentation
└── setup-analytics-api.sh               ✨ NEW - Setup script
```

---

## 📋 Setup Instructions

### Step 1: Setup Analytics Environment

```bash
cd /home/seth/Documents/code/ACCORD/ACCORDBACKEND/project

# Run the setup script
./setup-analytics-api.sh
```

This will:
- ✅ Check Python environment exists
- ✅ Create reports directory
- ✅ Test database connection
- ✅ Verify everything is ready

### Step 2: Start Backend Server

```bash
# Make sure you're in the project directory
cd /home/seth/Documents/code/ACCORD/ACCORDBACKEND/project

# Start the server
npm run dev
```

The backend will now:
- 🔄 Listen on port **4500**
- 📊 Serve analytics via `/api/analytics/*` endpoints
- ⏰ Auto-generate analytics on schedule
- 📧 Send emails to admins when reports are ready

---

## 🔌 API Endpoints

### 1. Generate Analytics (Manual)

```http
POST http://localhost:4500/api/analytics/generate?daysBack=30
Authorization: Bearer <your_token>
```

**Access**: Admin & Manager only

**Use this when**: User clicks "Generate New Analytics" button

---

### 2. Check Status

```http
GET http://localhost:4500/api/analytics/status
Authorization: Bearer <your_token>
```

**Returns**:
```json
{
  "success": true,
  "data": {
    "lastUpdated": "2025-10-19T10:30:00Z",
    "isGenerating": false,
    "hasData": true
  }
}
```

**Use this when**: Checking if analytics are ready or being generated

---

### 3. Get Interactive Dashboard

```http
GET http://localhost:4500/api/analytics/dashboard
Authorization: Bearer <your_token>
```

**Returns**: HTML content (ready to display in iframe)

**Use this when**: Displaying main analytics dashboard

---

### 4. List All Visualizations

```http
GET http://localhost:4500/api/analytics/visualizations
Authorization: Bearer <your_token>
```

**Returns**: Array of all charts, dashboards, and reports with URLs

**Use this when**: Building a gallery of analytics visualizations

---

### 5. Download Excel Report

```http
GET http://localhost:4500/api/analytics/report/latest
Authorization: Bearer <your_token>
```

**Returns**: Excel file (.xlsx)

**Use this when**: User clicks "Download Report" button

---

### 6. Get Specific File

```http
GET http://localhost:4500/api/analytics/files/performance_20251019_103045.png
Authorization: Bearer <your_token>
```

**Returns**: File content (PNG, HTML, or XLSX)

**Use this when**: Displaying specific charts or visualizations

---

### 7. Cleanup Old Reports

```http
DELETE http://localhost:4500/api/analytics/cleanup?daysOld=30
Authorization: Bearer <your_token>
```

**Access**: Admin only

**Use this when**: Managing disk space

---

## ⏰ Automatic Generation Schedule

| Frequency | Schedule | Days Analyzed | Notification |
|-----------|----------|---------------|--------------|
| **Weekly** | Monday 8:00 AM | Last 7 days | No |
| **Monthly** | 1st of month 7:00 AM | Last 30 days | ✅ Email to admins |

---

## 💻 Frontend Integration

### React Example

Create a new page/component in your frontend:

```jsx
// src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Analytics = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const API_URL = 'http://localhost:4500/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/analytics/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const generateAnalytics = async () => {
    try {
      await axios.post(`${API_URL}/analytics/generate?daysBack=30`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Analytics generation started!');
      setTimeout(checkStatus, 5000);
    } catch (error) {
      alert('Error generating analytics');
    }
  };

  const downloadReport = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/report/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('No report available yet');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="analytics-page">
      <div className="header">
        <h1>Analytics Dashboard</h1>
        <div className="actions">
          <button onClick={generateAnalytics} disabled={status?.isGenerating}>
            {status?.isGenerating ? 'Generating...' : 'Generate New Analytics'}
          </button>
          <button onClick={downloadReport}>
            Download Excel Report
          </button>
        </div>
      </div>

      {status?.lastUpdated && (
        <p>Last Updated: {new Date(status.lastUpdated).toLocaleString()}</p>
      )}

      {/* Interactive Dashboard */}
      <div className="dashboard-container">
        <iframe 
          src={`${API_URL}/analytics/dashboard`}
          width="100%" 
          height="800px"
          style={{ border: 'none', borderRadius: '8px' }}
          title="Analytics Dashboard"
        />
      </div>
    </div>
  );
};

export default Analytics;
```

### Add Route

```jsx
// In your router
import Analytics from './pages/Analytics';

<Route path="/analytics" element={<Analytics />} />
```

---

## 📊 What Analytics Are Available

### Automatically Generated

1. **Performance Comparison Charts**
   - Revenue by sales person
   - Visits by sales person
   - Conversion rates
   - Success rates

2. **Regional Heatmap**
   - Performance across regions
   - Color-coded metrics

3. **Conversion Funnel**
   - Interactive funnel visualization
   - Visit → Order conversion tracking

4. **Time Series Trends**
   - Daily visits over time
   - Daily orders over time

5. **Client Distribution**
   - Pie charts by client type
   - Revenue potential analysis

6. **Interactive Dashboard**
   - All metrics in one view
   - Fully interactive with Plotly

7. **Excel Report**
   - Multiple sheets with all data
   - Performance, regional, opportunities, etc.

---

## 🔒 Security

- ✅ All endpoints require JWT authentication
- ✅ Admin/Manager only for generation
- ✅ Path traversal protection on file serving
- ✅ File type validation
- ✅ Rate limiting applied

---

## 🐛 Troubleshooting

### "No reports available yet"

**Solution**: Generate analytics manually
```bash
cd /home/seth/Documents/code/ACCORD/ACCORDBACKEND/analytics
source venv/bin/activate
python main.py 30
```

### "Python environment not found"

**Solution**: Run setup script
```bash
cd /home/seth/Documents/code/ACCORD/ACCORDBACKEND/project
./setup-analytics-api.sh
```

### "Database connection failed"

**Solution**: Check MongoDB URI in `.env`
```bash
# Verify it's correct
cat .env | grep MONGODB_URI
```

### "Analytics generation fails"

**Check logs**:
```bash
# Backend logs
tail -f logs/combined.log

# Check if Python script works standalone
cd ../analytics
source venv/bin/activate
python main.py 7
```

---

## 📝 Testing the API

### Using curl

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:4500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.data.tokens.accessToken')

# 2. Check status
curl http://localhost:4500/api/analytics/status \
  -H "Authorization: Bearer $TOKEN"

# 3. Generate analytics
curl -X POST "http://localhost:4500/api/analytics/generate?daysBack=30" \
  -H "Authorization: Bearer $TOKEN"

# 4. Get dashboard
curl http://localhost:4500/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" > dashboard.html

# 5. Download report
curl http://localhost:4500/api/analytics/report/latest \
  -H "Authorization: Bearer $TOKEN" > report.xlsx
```

### Using Postman

Import this collection:
```json
{
  "info": { "name": "ACCORD Analytics API" },
  "item": [
    {
      "name": "Generate Analytics",
      "request": {
        "method": "POST",
        "url": "http://localhost:4500/api/analytics/generate?daysBack=30",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}]
      }
    },
    {
      "name": "Get Status",
      "request": {
        "method": "GET",
        "url": "http://localhost:4500/api/analytics/status",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}]
      }
    }
  ]
}
```

---

## 🎉 Quick Start Checklist

- [ ] Run `./setup-analytics-api.sh`
- [ ] Start backend: `npm run dev`
- [ ] Create Analytics page in frontend
- [ ] Add route: `/analytics`
- [ ] Test dashboard display
- [ ] Test manual generation
- [ ] Test Excel download
- [ ] Wait for automatic generation (Monday or 1st)

---

## 📚 Additional Resources

- **Full API Docs**: See `ANALYTICS_API.md`
- **Python Analytics**: See `../analytics/GUIDE.md`
- **Backend Setup**: See `README.md`

---

## 💡 Pro Tips

1. **Caching**: Cache the dashboard HTML in frontend to reduce server calls
2. **Polling**: Poll status endpoint every 10s when generating
3. **Error Handling**: Always check if reports exist before trying to download
4. **Responsive Design**: Dashboard iframe should be responsive
5. **Loading States**: Show spinners during generation and file downloads

---

**Ready to integrate analytics into your frontend!** 🚀

For questions, check the logs or contact the development team.
