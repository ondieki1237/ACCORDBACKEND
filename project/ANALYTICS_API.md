# Analytics API Documentation

## Overview

The Analytics API provides endpoints to generate, retrieve, and display Python-powered analytics for the ACCORD Medical system. Analytics are automatically generated on a schedule and can also be triggered manually.

## Base URL

```
http://localhost:4500/api/analytics
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Generate Analytics

**POST** `/api/analytics/generate`

Manually trigger analytics generation.

**Access**: Admin and Manager only

**Query Parameters**:
- `daysBack` (optional): Number of days to analyze (default: 30)

**Request**:
```http
POST /api/analytics/generate?daysBack=30
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Analytics generation started",
  "status": "processing"
}
```

---

### 2. Get Analytics Status

**GET** `/api/analytics/status`

Check if analytics are currently being generated.

**Access**: All authenticated users

**Request**:
```http
GET /api/analytics/status
Authorization: Bearer <token>
```

**Response**:
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

---

### 3. Get Latest Excel Report

**GET** `/api/analytics/report/latest`

Download the most recent Excel analytics report.

**Access**: All authenticated users

**Request**:
```http
GET /api/analytics/report/latest
Authorization: Bearer <token>
```

**Response**: Excel file download (`.xlsx`)

---

### 4. Get All Visualizations

**GET** `/api/analytics/visualizations`

Get a list of all available analytics files (charts, dashboards, reports).

**Access**: All authenticated users

**Request**:
```http
GET /api/analytics/visualizations
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "dashboard_20251019_103045.html",
      "type": "html",
      "size": 524288,
      "createdAt": "2025-10-19T10:30:45Z",
      "url": "/api/analytics/files/dashboard_20251019_103045.html"
    },
    {
      "name": "performance_20251019_103045.png",
      "type": "image",
      "size": 153600,
      "createdAt": "2025-10-19T10:30:45Z",
      "url": "/api/analytics/files/performance_20251019_103045.png"
    }
  ]
}
```

---

### 5. Get Interactive Dashboard

**GET** `/api/analytics/dashboard`

Get the latest interactive HTML dashboard.

**Access**: All authenticated users

**Request**:
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Response**: HTML content (can be embedded in iframe or rendered directly)

**Usage in Frontend**:
```javascript
// Fetch and display in iframe
const response = await fetch('/api/analytics/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const html = await response.text();
document.getElementById('dashboard-iframe').srcdoc = html;
```

---

### 6. Get Specific File

**GET** `/api/analytics/files/:filename`

Retrieve a specific analytics file (chart, report, etc.).

**Access**: All authenticated users

**Parameters**:
- `filename`: Name of the file to retrieve

**Request**:
```http
GET /api/analytics/files/performance_20251019_103045.png
Authorization: Bearer <token>
```

**Response**: File content with appropriate content-type

**Supported File Types**:
- `.png` - Charts/images
- `.html` - Interactive visualizations
- `.xlsx` - Excel reports

**Usage in Frontend**:
```html
<!-- Display chart image -->
<img src="/api/analytics/files/performance_20251019_103045.png" 
     alt="Performance Chart"
     headers='{"Authorization": "Bearer <token>"}' />

<!-- Embed HTML visualization -->
<iframe src="/api/analytics/files/funnel_20251019_103045.html"></iframe>
```

---

### 7. Cleanup Old Reports

**DELETE** `/api/analytics/cleanup`

Delete analytics files older than specified days.

**Access**: Admin only

**Query Parameters**:
- `daysOld` (optional): Delete files older than this (default: 30)

**Request**:
```http
DELETE /api/analytics/cleanup?daysOld=30
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Deleted 5 old report(s)",
  "deletedCount": 5
}
```

---

## Automatic Analytics Generation

Analytics are automatically generated on the following schedule:

| Schedule | Frequency | Days Analyzed | Reports Generated |
|----------|-----------|---------------|-------------------|
| **Weekly** | Every Monday, 8:00 AM | Last 7 days | Dashboard, charts, Excel |
| **Monthly** | 1st of month, 7:00 AM | Last 30 days | Dashboard, charts, Excel |

Admins and managers receive email notifications when monthly analytics are generated.

---

## Frontend Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get status
      const statusRes = await axios.get('/api/analytics/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(statusRes.data.data);

      // Get visualizations list
      const vizRes = await axios.get('/api/analytics/visualizations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisualizations(vizRes.data.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const generateAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/analytics/generate?daysBack=30', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Analytics generation started!');
      setTimeout(fetchAnalytics, 5000); // Refresh after 5 seconds
    } catch (error) {
      console.error('Error generating analytics:', error);
    }
  };

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/analytics/report/latest', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analytics_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>
      
      {/* Status */}
      <div className="status-bar">
        <p>Last Updated: {status?.lastUpdated || 'Never'}</p>
        <p>Status: {status?.isGenerating ? 'Generating...' : 'Ready'}</p>
        <button onClick={generateAnalytics} disabled={status?.isGenerating}>
          Generate New Analytics
        </button>
        <button onClick={downloadReport}>
          Download Excel Report
        </button>
      </div>

      {/* Interactive Dashboard */}
      <div className="dashboard-container">
        <h2>Interactive Dashboard</h2>
        <iframe 
          src="/api/analytics/dashboard"
          width="100%" 
          height="600px"
          style={{ border: 'none' }}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <h2>Visualizations</h2>
        {visualizations.filter(v => v.type === 'image').map(viz => (
          <div key={viz.name} className="chart-item">
            <img 
              src={viz.url} 
              alt={viz.name}
              style={{ maxWidth: '100%' }}
            />
          </div>
        ))}
      </div>

      {/* HTML Visualizations */}
      <div className="html-visualizations">
        {visualizations.filter(v => v.type === 'html' && !v.name.includes('dashboard')).map(viz => (
          <div key={viz.name}>
            <h3>{viz.name}</h3>
            <iframe 
              src={viz.url}
              width="100%" 
              height="400px"
              style={{ border: '1px solid #ccc' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token or user account is disabled"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "No reports available yet"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Analytics generation already in progress"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to generate analytics"
}
```

---

## Best Practices

1. **Check Status First**: Before triggering generation, check if analytics are already being generated
2. **Cache Results**: Cache dashboard and visualizations on the frontend to reduce server load
3. **Polling**: If generating analytics, poll the status endpoint every 5-10 seconds
4. **Error Handling**: Always handle cases where analytics haven't been generated yet
5. **Download Progress**: Show loading indicators when downloading large Excel files

---

## Notes

- Analytics generation can take 30 seconds to several minutes depending on data volume
- The Python environment must be set up in the `analytics/` folder
- Files are automatically cleaned up after 30 days (configurable)
- All times are in UTC
- Maximum file upload size: 10MB

---

## Support

For issues or questions, check:
1. Server logs: `logs/combined.log`
2. Python analytics logs in console output
3. Ensure Python environment is activated: `analytics/venv/`

---

**Version**: 1.0.0  
**Last Updated**: October 2025
