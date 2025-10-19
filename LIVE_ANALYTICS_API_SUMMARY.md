# Live Analytics API - Complete Summary

## 🎯 Overview

The Live Analytics API is a **persistent Python Flask server** that provides **real-time analytics data** for the ACCORD Medical system. Unlike batch processing that runs and exits, this API stays running continuously and responds to requests with live data from MongoDB.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│   Frontend (Next.js Admin Dashboard)   │
│   - Auto-refreshing every 30-60s       │
│   - Charts, metrics, tables             │
└──────────────────┬──────────────────────┘
                   │ HTTP Requests
                   │ (JWT Authentication)
                   ▼
┌─────────────────────────────────────────┐
│   Node.js Backend (Port 4500)          │
│   - Express.js API Gateway             │
│   - JWT Token Verification             │
│   - Request Proxy to Python            │
└──────────────────┬──────────────────────┘
                   │ HTTP Proxy
                   │ (axios requests)
                   ▼
┌─────────────────────────────────────────┐
│   Python Flask API (Port 5001)         │
│   - Persistent Server (Always Running) │
│   - Direct MongoDB Queries             │
│   - pandas, numpy, scikit-learn        │
│   - Real-time Calculations             │
└──────────────────┬──────────────────────┘
                   │ Direct Connection
                   │ (pymongo)
                   ▼
┌─────────────────────────────────────────┐
│   MongoDB Atlas                         │
│   - Live Production Data               │
│   - Indexed Collections                │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

```
ACCORDBACKEND/
├── analytics/
│   ├── api_server.py              # Flask API server (main file)
│   ├── database.py                # MongoDB connection wrapper
│   ├── sales_analytics.py         # Business metrics calculations
│   ├── predictive_analytics.py    # ML predictions
│   ├── visualizations.py          # Chart generation
│   ├── start.sh                   # Simple startup script
│   ├── requirements.txt           # Python dependencies
│   └── venv/                      # Virtual environment
│
├── project/
│   └── src/
│       ├── controllers/
│       │   └── liveAnalyticsController.js  # Proxy to Python API
│       ├── routes/
│       │   └── liveAnalytics.js            # Live analytics routes
│       └── server.js                        # Includes live routes
│
└── start.sh                       # Starts both services
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:4500/api/analytics/live
```

All endpoints require **JWT authentication** via `Authorization: Bearer <token>` header.

### Available Endpoints

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| **GET** | `/health` | Check Python API status | - |
| **GET** | `/realtime` | Today's live statistics | - |
| **GET** | `/summary` | Performance summary | `daysBack=30` |
| **GET** | `/dashboard` | Complete dashboard data | `daysBack=30` |
| **GET** | `/conversion` | Conversion funnel analysis | `daysBack=30` |
| **GET** | `/regional` | Regional performance | `daysBack=30` |
| **GET** | `/top-performers` | Top performing users | `daysBack=30`, `topN=10` |
| **GET** | `/predictions` | ML predictions & forecasts | `daysBack=90` |
| **GET** | `/users-activity` | User activity tracking | `daysBack=7` |
| **GET** | `/chart/:type` | Live chart images (PNG) | `daysBack=30` |

### Chart Types
- `performance` - Sales performance comparison
- `heatmap` - Regional performance heatmap
- `funnel` - Conversion funnel visualization
- `trends` - Sales trends over time

---

## 📊 Response Examples

### 1. Real-time Statistics (`/realtime`)

```json
{
  "success": true,
  "data": {
    "visits_today": 45,
    "orders_today": 12,
    "revenue_today": 125000.50,
    "successful_visits": 38,
    "conversion_rate_today": 26.67,
    "active_users": 15
  },
  "timestamp": "2025-10-19T10:30:00.000Z",
  "date": "2025-10-19"
}
```

### 2. Complete Dashboard (`/dashboard`)

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_visits": 1250,
      "total_orders": 320,
      "total_revenue": 4500000.00,
      "conversion_rate": 25.6,
      "avg_order_value": 14062.50
    },
    "conversion_funnel": {
      "visits": 1250,
      "successful_visits": 980,
      "quotations_sent": 450,
      "orders_placed": 320,
      "visit_success_rate": 78.4,
      "quotation_conversion": 71.11,
      "overall_conversion": 25.6
    },
    "regional_performance": [
      {
        "region": "Nairobi",
        "visit_count": 450,
        "order_count": 120,
        "total_revenue": 1800000.00,
        "conversion_rate": 26.67
      },
      // ... more regions
    ],
    "top_performers": [
      {
        "userId": "user123",
        "name": "John Doe",
        "role": "sales",
        "region": "Nairobi",
        "visit_count": 85,
        "order_count": 28,
        "total_revenue": 420000.00,
        "conversion_rate": 32.94
      },
      // ... more users
    ]
  },
  "timestamp": "2025-10-19T10:30:00.000Z",
  "period": "Last 30 days"
}
```

### 3. Predictions (`/predictions`)

```json
{
  "success": true,
  "data": {
    "revenue_forecast": {
      "next_week": 450000.00,
      "next_month": 1800000.00,
      "trend": "increasing",
      "confidence": 0.85
    },
    "churn_risks": [
      {
        "userId": "user456",
        "name": "Jane Smith",
        "risk_score": 0.75,
        "reason": "No visits in last 14 days",
        "last_activity": "2025-10-05"
      }
    ],
    "high_value_opportunities": [
      {
        "facilityId": "fac789",
        "facility_name": "City Hospital",
        "potential_revenue": 250000.00,
        "last_visit": "2025-10-15",
        "recommendation": "Follow up within 3 days"
      }
    ]
  },
  "timestamp": "2025-10-19T10:30:00.000Z"
}
```

### 4. Top Performers (`/top-performers`)

```json
{
  "success": true,
  "data": [
    {
      "userId": "user123",
      "name": "John Doe",
      "role": "sales",
      "region": "Nairobi",
      "visit_count": 85,
      "order_count": 28,
      "total_revenue": 420000.00,
      "conversion_rate": 32.94,
      "avg_order_value": 15000.00
    },
    // ... top 10 users
  ],
  "timestamp": "2025-10-19T10:30:00.000Z"
}
```

---

## 🚀 Starting the API

### Method 1: Start All Services (Recommended)

```bash
# From ACCORDBACKEND root
./start.sh
```

This starts:
- Python Flask API on port 5001
- Node.js backend on port 4500

### Method 2: Python API Only

```bash
cd analytics
./start.sh
```

### Method 3: Manual Start

```bash
cd analytics
source venv/bin/activate
python api_server.py
```

---

## 🧪 Testing

### Health Check

```bash
# Direct Python API
curl http://localhost:5001/health

# Via Node.js proxy (no auth needed for health)
curl http://localhost:4500/api/analytics/live/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T10:30:00.000Z",
  "service": "Analytics API",
  "pythonApi": {
    "status": "healthy",
    "timestamp": "2025-10-19T10:30:00.000Z",
    "service": "Analytics API"
  },
  "nodeApi": {
    "status": "healthy",
    "timestamp": "2025-10-19T10:30:00.000Z"
  }
}
```

### With Authentication

```bash
# Get JWT token first (login)
TOKEN=$(curl -X POST http://localhost:4500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@accord.com","password":"admin123"}' \
  | jq -r '.token')

# Test realtime stats
curl http://localhost:4500/api/analytics/live/realtime \
  -H "Authorization: Bearer $TOKEN"

# Test dashboard
curl http://localhost:4500/api/analytics/live/dashboard?daysBack=30 \
  -H "Authorization: Bearer $TOKEN"

# Download chart
curl http://localhost:4500/api/analytics/live/chart/performance?daysBack=30 \
  -H "Authorization: Bearer $TOKEN" \
  --output performance.png
```

---

## 💻 Frontend Integration

### React Hook for Live Data

```jsx
import { useState, useEffect } from 'react';

export function useLiveAnalytics(daysBack = 30, refreshInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `/api/analytics/live/dashboard?daysBack=${daysBack}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch analytics');
        
        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [daysBack, refreshInterval]);

  return { data, loading, error };
}
```

### Usage Example

```jsx
export default function AdminDashboard() {
  const { data, loading, error } = useLiveAnalytics(30, 30000);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Live Analytics</h1>
      
      {/* Metrics */}
      <div className="metrics">
        <MetricCard 
          title="Total Visits"
          value={data.summary.total_visits}
        />
        <MetricCard 
          title="Total Orders"
          value={data.summary.total_orders}
        />
        <MetricCard 
          title="Revenue"
          value={`KES ${data.summary.total_revenue.toLocaleString()}`}
        />
        <MetricCard 
          title="Conversion"
          value={`${data.summary.conversion_rate.toFixed(2)}%`}
        />
      </div>

      {/* Charts */}
      <div className="charts">
        <img 
          src="/api/analytics/live/chart/performance?daysBack=30"
          alt="Performance"
        />
        <img 
          src="/api/analytics/live/chart/funnel?daysBack=30"
          alt="Funnel"
        />
      </div>

      {/* Top Performers */}
      <TopPerformersTable data={data.top_performers} />
    </div>
  );
}
```

---

## 🔐 Security

### Authentication Flow

1. **Frontend** → Login → Get JWT token
2. **Frontend** → Request analytics with token
3. **Node.js** → Verify JWT token
4. **Node.js** → Proxy to Python API
5. **Python** → Query MongoDB → Return data
6. **Node.js** → Return to frontend

### Access Control

- **Admin**: Full access to all endpoints
- **Manager**: Full access to all endpoints
- **Sales**: No access (analytics is admin/manager only)

### Rate Limiting

Node.js backend applies rate limiting:
- Global: 1000 requests per 15 minutes
- Per-user: 60 requests per minute

---

## ⚡ Performance

### Response Times

| Endpoint | Typical Response Time |
|----------|----------------------|
| `/realtime` | 200-500ms |
| `/summary` | 500ms-1s |
| `/dashboard` | 1-2s |
| `/predictions` | 2-5s (ML processing) |
| `/chart/*` | 1-3s (image generation) |

### Optimization

- **Connection Pooling**: MongoDB connections are pooled
- **Threading**: Flask uses threading for concurrent requests
- **Caching**: Can add Redis for frequently accessed data
- **Indexes**: MongoDB collections are indexed for fast queries

---

## 🐛 Troubleshooting

### Python API Not Starting

```bash
# Check virtual environment
cd analytics
ls -la venv/

# Reinstall if needed
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Test manually
python api_server.py
```

### Import Errors

```bash
# Ensure correct class names
grep "class.*:" analytics/visualizations.py
# Should show: class Visualizations:

# Check api_server.py imports
grep "from visualizations import" analytics/api_server.py
# Should show: from visualizations import Visualizations
```

### Port Already in Use

```bash
# Kill processes on ports
pkill -f 'python.*api_server'
pkill -f 'node.*server.js'

# Or specific ports
lsof -ti:5001 | xargs kill -9
lsof -ti:4500 | xargs kill -9
```

### MongoDB Connection Issues

```bash
# Check .env file
cat project/.env | grep MONGODB_URI

# Test connection
cd analytics
source venv/bin/activate
python -c "from database import AccordDatabase; db = AccordDatabase()"
```

### No Data Returned

```bash
# Check if collections have data
# Via MongoDB Compass or mongosh

# Test direct query
curl http://localhost:5001/api/analytics/live/summary?daysBack=30
```

---

## 📊 Data Models

### Sales Performance Summary

```python
{
    "total_visits": int,
    "total_orders": int,
    "total_revenue": float,
    "conversion_rate": float,
    "avg_order_value": float,
    "successful_visits": int,
    "pending_quotations": int
}
```

### Conversion Funnel

```python
{
    "visits": int,
    "successful_visits": int,
    "quotations_sent": int,
    "orders_placed": int,
    "visit_success_rate": float,
    "quotation_conversion": float,
    "overall_conversion": float
}
```

### Regional Performance

```python
[{
    "region": str,
    "visit_count": int,
    "order_count": int,
    "total_revenue": float,
    "conversion_rate": float,
    "avg_order_value": float
}]
```

### User Performance

```python
[{
    "userId": str,
    "name": str,
    "role": str,
    "region": str,
    "visit_count": int,
    "order_count": int,
    "total_revenue": float,
    "conversion_rate": float,
    "avg_order_value": float
}]
```

---

## 🔄 Comparison: Live vs Batch Analytics

| Feature | Live Analytics | Batch Analytics |
|---------|---------------|-----------------|
| **Server Status** | Always running | Runs and exits |
| **Data Freshness** | Real-time | Scheduled (weekly/monthly) |
| **Update Method** | On every request | Cron jobs |
| **Output Format** | JSON API | Files (Excel, PNG, HTML) |
| **Use Case** | Admin dashboard | Reports, emails |
| **Response Time** | < 2 seconds | N/A (file-based) |
| **Today's Stats** | ✅ Available | ❌ Not available |
| **Auto-refresh** | ✅ Yes | ❌ No |
| **Email Distribution** | ❌ No | ✅ Yes |
| **Historical Archive** | ❌ No | ✅ Yes |

### When to Use Each

**Use Live Analytics When:**
- Building admin dashboards
- Need real-time metrics
- Want auto-refreshing displays
- Showing today's statistics
- Interactive data exploration

**Use Batch Analytics When:**
- Generating weekly/monthly reports
- Need Excel exports
- Email distribution required
- Historical record keeping
- Deep dive analysis

---

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start Python API
cd analytics
pm2 start api_server.py --name analytics-api --interpreter python

# Start Node.js
cd ../project
pm2 start npm --name backend -- run dev

# Save and auto-start
pm2 save
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/analytics-api.service`:

```ini
[Unit]
Description=ACCORD Analytics API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ACCORDBACKEND/analytics
Environment="PATH=/path/to/ACCORDBACKEND/analytics/venv/bin"
ExecStart=/path/to/ACCORDBACKEND/analytics/venv/bin/python api_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable analytics-api
sudo systemctl start analytics-api
sudo systemctl status analytics-api
```

---

## 📈 Monitoring

### Health Checks

```bash
# Create a monitoring script
#!/bin/bash
while true; do
  STATUS=$(curl -s http://localhost:5001/health | jq -r '.status')
  if [ "$STATUS" != "healthy" ]; then
    echo "$(date): Analytics API is down!" | mail -s "Alert" admin@accord.com
  fi
  sleep 60
done
```

### Logs

```bash
# View logs
tail -f analytics/python-api.log
tail -f project/logs/combined.log

# PM2 logs
pm2 logs analytics-api
pm2 logs backend
```

---

## 🎯 Summary

The Live Analytics API provides:

✅ **Real-time data** - Always current, never stale  
✅ **Fast responses** - < 2 seconds for most endpoints  
✅ **Auto-refresh ready** - Perfect for dashboards  
✅ **ML predictions** - Revenue forecasts, churn detection  
✅ **Live charts** - PNG images generated on demand  
✅ **Scalable** - Handles concurrent requests  
✅ **Secure** - JWT authentication required  
✅ **Production-ready** - Can be deployed with PM2/systemd  

---

## 📚 Related Documentation

- `RUNNING_NOW.md` - Current status and setup guide
- `LIVE_ANALYTICS_SETUP.md` - Complete installation guide
- `LIVE_ANALYTICS_GUIDE.md` - Integration details
- `ANALYTICS_SYSTEM_OVERVIEW.md` - Full system reference

---

**Created**: October 19, 2025  
**Status**: ✅ Operational  
**Python API**: Port 5001  
**Node.js API**: Port 4500  
**Version**: 1.0.0
