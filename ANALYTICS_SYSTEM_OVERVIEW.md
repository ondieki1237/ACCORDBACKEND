# 📊 ACCORD Analytics - Complete System

## Overview

ACCORD Medical now has **TWO analytics systems**:

1. **📁 Batch Analytics** (Original) - Scheduled reports generation
2. **🔴 Live Analytics** (NEW) - Real-time data API

Choose based on your needs!

---

## System Comparison

| Feature | Batch Analytics | Live Analytics |
|---------|----------------|----------------|
| **Data Freshness** | Updated on schedule | Real-time |
| **Update Frequency** | Weekly/Monthly | Every request |
| **Output Format** | Files (PNG, Excel, HTML) | JSON + Charts |
| **Use Case** | Reports, Email attachments | Dashboard, UI |
| **Server Status** | Runs and exits | Always running |
| **Best For** | Historical reports | Admin dashboard |

---

## 🔴 Live Analytics (Recommended for Dashboard)

### Architecture

```
┌─────────────────────────────┐
│   Frontend (Next.js)        │
│   Real-time Dashboard       │
└──────────┬──────────────────┘
           │ HTTP Requests (every 30s)
           ▼
┌─────────────────────────────┐
│   Node.js Backend           │
│   Port 4500                 │
│   - JWT Auth                │
│   - API Proxy               │
└──────────┬──────────────────┘
           │ Forwards requests
           ▼
┌─────────────────────────────┐
│   Python Flask API          │
│   Port 5001                 │
│   - Always Running          │
│   - Live Queries            │
│   - ML Predictions          │
└──────────┬──────────────────┘
           │ Direct queries
           ▼
┌─────────────────────────────┐
│   MongoDB Atlas             │
│   Live Data                 │
└─────────────────────────────┘
```

### Quick Start

```bash
# Start both services
./start-all.sh

# Or start separately:
# Terminal 1: cd analytics && ./start-api.sh
# Terminal 2: cd project && npm run dev
```

### Live Endpoints

All require JWT authentication via Node.js backend:

```javascript
// Today's statistics (updates in real-time)
GET /api/analytics/live/realtime

// Complete dashboard data
GET /api/analytics/live/dashboard?daysBack=30

// Individual metrics
GET /api/analytics/live/summary?daysBack=30
GET /api/analytics/live/conversion?daysBack=30
GET /api/analytics/live/regional?daysBack=30
GET /api/analytics/live/top-performers?daysBack=30&topN=10
GET /api/analytics/live/predictions?daysBack=90

// Live charts (PNG images)
GET /api/analytics/live/chart/performance?daysBack=30
GET /api/analytics/live/chart/heatmap?daysBack=30
GET /api/analytics/live/chart/funnel?daysBack=30
GET /api/analytics/live/chart/trends?daysBack=30

// User activity
GET /api/analytics/live/users-activity?daysBack=7

// Health check
GET /api/analytics/live/health
```

### Frontend Integration

```jsx
// Auto-refreshing dashboard component
import { useEffect, useState } from 'react';

export default function LiveDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/analytics/live/dashboard?daysBack=30', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setStats(result.data);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Live Analytics</h1>
      
      {/* Real-time metrics */}
      <div className="metrics">
        <Metric label="Visits" value={stats?.summary.total_visits} />
        <Metric label="Orders" value={stats?.summary.total_orders} />
        <Metric label="Revenue" value={`KES ${stats?.summary.total_revenue}`} />
        <Metric label="Conversion" value={`${stats?.summary.conversion_rate}%`} />
      </div>

      {/* Live charts */}
      <img src="/api/analytics/live/chart/performance?daysBack=30" />
      
      {/* Top performers */}
      <table>
        {stats?.top_performers.map(user => (
          <tr key={user.userId}>
            <td>{user.name}</td>
            <td>{user.visit_count}</td>
            <td>KES {user.total_revenue}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

### Benefits

✅ **Real-time data** - Always current  
✅ **Auto-refresh dashboards** - Live updates  
✅ **Today's statistics** - Current day metrics  
✅ **Fast responses** - < 2 seconds  
✅ **Lower server load** - Query only what's needed  
✅ **Better UX** - No waiting for reports  

---

## 📁 Batch Analytics (Reports & Emails)

### Architecture

```
┌─────────────────────────────┐
│   Node.js Backend           │
│   - Cron Jobs               │
│   - Scheduled Tasks         │
└──────────┬──────────────────┘
           │ Executes Python script
           ▼
┌─────────────────────────────┐
│   Python Scripts            │
│   - Run once                │
│   - Generate files          │
│   - Exit after completion   │
└──────────┬──────────────────┘
           │ Writes to
           ▼
┌─────────────────────────────┐
│   File System               │
│   analytics/output/         │
│   - charts/*.png            │
│   - dashboard.html          │
│   - analytics_report.xlsx   │
└──────────┬──────────────────┘
           │ Served by
           ▼
┌─────────────────────────────┐
│   Node.js API               │
│   GET /api/analytics/files/ │
└─────────────────────────────┘
```

### Schedule

- **Weekly**: Every Monday at 8:00 AM
- **Monthly**: 1st of month at 7:00 AM

### Manual Generation

```bash
# Via API (requires admin/manager role)
POST /api/analytics/generate?daysBack=30

# Via command line
cd analytics
source venv/bin/activate
python main.py 30  # Last 30 days
```

### Batch Endpoints

```javascript
// Generate new report
POST /api/analytics/generate?daysBack=30

// Check generation status
GET /api/analytics/status

// Get latest report
GET /api/analytics/report/latest

// Get dashboard HTML
GET /api/analytics/dashboard

// List all files
GET /api/analytics/visualizations

// Download specific file
GET /api/analytics/files/:filename

// Cleanup old reports
DELETE /api/analytics/cleanup?daysOld=30
```

### Outputs

Generated files in `analytics/output/`:

- **Charts**: Performance, heatmap, funnel, trends (PNG)
- **Dashboard**: Interactive HTML with Plotly charts
- **Report**: Comprehensive Excel workbook
- **Console**: Formatted text report

### Email Notifications

Admins receive emails when reports are generated:

- Weekly summary every Monday
- Monthly comprehensive report
- Contains download links
- Includes key metrics

### Benefits

✅ **Complete reports** - All data in one file  
✅ **Email delivery** - Automatic distribution  
✅ **Historical archive** - Saved reports  
✅ **Excel exports** - For further analysis  
✅ **Low overhead** - Runs periodically  
✅ **Offline access** - Download and share  

---

## Hybrid Approach (Recommended)

Use **both systems** together:

### 1. Live Analytics for Dashboard

```jsx
// Admin dashboard - real-time metrics
<LiveDashboard />
- Shows today's stats
- Auto-refreshes every 30s
- Interactive charts
- Current performance
```

### 2. Batch Analytics for Reports

```jsx
// Reports page - historical analysis
<ReportsPage />
- Weekly/monthly summaries
- Email distribution
- Excel exports
- Deep dive analysis
```

---

## Installation & Setup

### Prerequisites

```bash
# Node.js dependencies (already installed)
cd project
npm install

# Python dependencies
cd ../analytics
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Environment Variables

Add to `project/.env`:

```env
# Node.js Backend
PORT=4500
MONGODB_URI=your_mongodb_connection_string

# Python Analytics API
PYTHON_API_URL=http://localhost:5001
ANALYTICS_PORT=5001
```

### Start Services

#### Option 1: All at Once (Recommended)

```bash
# From ACCORDBACKEND root
./start-all.sh
```

#### Option 2: Separately

**Terminal 1 - Python API (Live Analytics):**
```bash
cd analytics
./start-api.sh
```

**Terminal 2 - Node.js Backend:**
```bash
cd project
npm run dev
```

---

## Testing

### Test Script

```bash
./test-live-analytics.sh
```

### Manual Tests

```bash
# Check Python API
curl http://localhost:5001/health

# Check Node.js backend
curl http://localhost:4500/api/health

# Test live analytics (requires auth token)
curl http://localhost:4500/api/analytics/live/realtime \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate batch report
curl -X POST http://localhost:4500/api/analytics/generate?daysBack=30 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start Python API
cd analytics
pm2 start api_server.py --name analytics-api --interpreter python

# Start Node.js backend
cd ../project
pm2 start npm --name backend -- run dev

# Save configuration
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs analytics-api
pm2 logs backend
```

### Using systemd

See `LIVE_ANALYTICS_GUIDE.md` for systemd service configuration.

---

## Monitoring

### Health Checks

```bash
# Python API
curl http://localhost:5001/health

# Node.js backend
curl http://localhost:4500/api/health

# Live analytics proxy
curl http://localhost:4500/api/analytics/live/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Logs

```bash
# Python API logs
tail -f analytics/logs/analytics.log

# Node.js logs
tail -f project/logs/combined.log

# PM2 logs (if using PM2)
pm2 logs analytics-api
pm2 logs backend
```

---

## Performance

### Live Analytics

- **Response Time**: 500ms - 2s
- **Concurrent Users**: 100+
- **MongoDB Queries**: Optimized with indexes
- **Refresh Rate**: 30-60 seconds recommended

### Batch Analytics

- **Generation Time**: 2-5 minutes (30 days)
- **File Sizes**: 1-5 MB
- **Schedule**: Weekly + Monthly
- **Storage**: ~50 MB per month

---

## Troubleshooting

### Python API not starting

```bash
cd analytics
source venv/bin/activate
pip install flask flask-cors
python api_server.py
```

### Connection refused

- Check if both services are running
- Verify ports 4500 and 5001 are not in use
- Check firewall settings

### Data not updating

- Verify MongoDB connection
- Check .env file exists
- Review Python logs for errors
- Ensure indexes are created

### Batch reports not generating

- Check cron job status
- Verify Python path in scheduledJobs.js
- Review logs/analytics.log
- Test manual generation

---

## File Structure

```
ACCORDBACKEND/
├── analytics/
│   ├── api_server.py           # Flask API (Live Analytics)
│   ├── main.py                 # Batch report generator
│   ├── database.py             # MongoDB connection
│   ├── sales_analytics.py      # Business metrics
│   ├── predictive_analytics.py # ML predictions
│   ├── visualizations.py       # Charts & dashboards
│   ├── quick_start.py          # Testing
│   ├── requirements.txt        # Python dependencies
│   ├── setup.sh                # Python environment setup
│   ├── start-api.sh            # Start Flask server
│   └── output/                 # Generated files
│       ├── charts/
│       ├── dashboard.html
│       └── analytics_report.xlsx
├── project/
│   └── src/
│       ├── controllers/
│       │   ├── analyticsController.js      # Batch analytics
│       │   └── liveAnalyticsController.js  # Live analytics proxy
│       ├── routes/
│       │   ├── analytics.js                # Batch routes
│       │   └── liveAnalytics.js            # Live routes
│       ├── services/
│       │   └── scheduledJobs.js            # Cron jobs
│       └── server.js                       # Main entry
├── start-all.sh                # Start all services
├── test-live-analytics.sh      # Test script
├── LIVE_ANALYTICS_SETUP.md     # Setup guide
├── LIVE_ANALYTICS_GUIDE.md     # Integration guide
├── ANALYTICS_API.md            # API documentation
└── ANALYTICS_INTEGRATION.md    # Batch analytics guide
```

---

## Quick Reference

### Commands

```bash
# Start everything
./start-all.sh

# Start Python API only
cd analytics && ./start-api.sh

# Start Node.js only
cd project && npm run dev

# Test services
./test-live-analytics.sh

# Generate batch report
curl -X POST localhost:4500/api/analytics/generate?daysBack=30 \
  -H "Authorization: Bearer TOKEN"

# Get live dashboard
curl localhost:4500/api/analytics/live/dashboard?daysBack=30 \
  -H "Authorization: Bearer TOKEN"
```

### Ports

- **Node.js Backend**: 4500
- **Python Flask API**: 5001
- **MongoDB**: 27017 (local) or Atlas (cloud)

### Access Control

- **Live Analytics**: Admin, Manager only
- **Batch Analytics**: Admin, Manager only
- **All endpoints**: JWT authentication required

---

## Support

For issues or questions:

1. Check logs: `project/logs/` and `analytics/logs/`
2. Review documentation in this repo
3. Test with `./test-live-analytics.sh`
4. Verify MongoDB connection
5. Check Python dependencies

---

**🎉 You now have a complete analytics system with both real-time and batch processing capabilities!**
