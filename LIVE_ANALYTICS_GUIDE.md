# Live Analytics API Integration Guide

## Overview

The Python analytics now runs as a **persistent Flask API server** that provides **live data** to your admin dashboard. This eliminates the need to run Python scripts repeatedly and enables real-time analytics.

## Architecture

```
┌─────────────────────────────────┐
│   Frontend (Next.js)            │
│   Admin Dashboard               │
└────────────┬────────────────────┘
             │ HTTP Requests
             ▼
┌─────────────────────────────────┐
│   Node.js Backend (Port 4500)   │
│   - API Gateway/Proxy           │
│   - JWT Authentication          │
└────────────┬────────────────────┘
             │ Forwards to
             ▼
┌─────────────────────────────────┐
│   Python Flask API (Port 5001)  │
│   - Live Analytics Engine       │
│   - Direct MongoDB Connection   │
│   - ML Predictions              │
└─────────────────────────────────┘
```

## Setup

### 1. Install Python Dependencies

```bash
cd analytics
pip install flask flask-cors
# Or run the full setup
./setup.sh
```

### 2. Add Environment Variable

Add to `project/.env`:
```env
PYTHON_API_URL=http://localhost:5001
ANALYTICS_PORT=5001
```

### 3. Install axios in Node.js

```bash
cd project
npm install axios
```

## Starting the Services

### Start Python Analytics API (Terminal 1)

```bash
cd analytics
chmod +x start-api.sh
./start-api.sh
```

This will start a persistent Flask server on port 5001.

### Start Node.js Backend (Terminal 2)

```bash
cd project
npm run dev
```

This runs on port 4500 and proxies requests to Python API.

## API Endpoints

All endpoints require JWT authentication and are accessible via the Node.js backend.

### Real-Time Endpoints

| Endpoint | Description | Query Params |
|----------|-------------|--------------|
| `GET /api/analytics/live/health` | Check Python API health | - |
| `GET /api/analytics/live/realtime` | Today's statistics | - |
| `GET /api/analytics/live/summary` | Sales performance summary | `daysBack=30` |
| `GET /api/analytics/live/dashboard` | Complete dashboard data | `daysBack=30` |
| `GET /api/analytics/live/conversion` | Conversion funnel | `daysBack=30` |
| `GET /api/analytics/live/regional` | Regional performance | `daysBack=30` |
| `GET /api/analytics/live/top-performers` | Top performers | `daysBack=30, topN=10` |
| `GET /api/analytics/live/predictions` | ML predictions | `daysBack=90` |
| `GET /api/analytics/live/users-activity` | User activity | `daysBack=7` |
| `GET /api/analytics/live/chart/:type` | Live chart image | `daysBack=30` |

### Chart Types

- `performance` - Sales performance comparison
- `heatmap` - Regional heatmap
- `funnel` - Conversion funnel visualization
- `trends` - Sales trends over time

## Usage Examples

### Frontend (React/Next.js)

```javascript
// Get real-time stats
const response = await fetch('/api/analytics/live/realtime', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data);
// {
//   success: true,
//   data: {
//     visits_today: 45,
//     orders_today: 12,
//     revenue_today: 125000,
//     conversion_rate_today: 26.67
//   },
//   timestamp: "2025-10-19T10:30:00.000Z"
// }
```

### Complete Dashboard Data

```javascript
const response = await fetch('/api/analytics/live/dashboard?daysBack=30', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
// Returns:
// - summary (total visits, orders, revenue)
// - conversion_funnel (stage-by-stage)
// - regional_performance (by region)
// - top_performers (top 10 users)
```

### Live Chart

```html
<!-- Display live performance chart -->
<img 
  src="/api/analytics/live/chart/performance?daysBack=30" 
  alt="Performance Chart"
  headers="Authorization: Bearer {token}"
/>
```

## Benefits Over Previous Approach

### Before (Run & Exit)
❌ Python script runs, generates files, exits  
❌ Data can be stale  
❌ Need to re-run for fresh data  
❌ File-based communication only  
❌ No real-time updates  

### Now (Persistent API)
✅ Python server runs continuously  
✅ **Live data on every request**  
✅ **Real-time analytics**  
✅ Direct JSON responses  
✅ Auto-refreshing dashboards  
✅ Better error handling  
✅ Lower latency  

## Monitoring

### Check Python API Health

```bash
curl http://localhost:5001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T10:30:00.000Z",
  "service": "Analytics API"
}
```

### Check via Node.js

```bash
curl http://localhost:4500/api/analytics/live/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Dashboard Integration Example

```javascript
// React Component for Admin Dashboard

import { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live data every 30 seconds
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/live/dashboard?daysBack=30', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="dashboard">
      <h1>Live Analytics Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="metrics">
        <MetricCard 
          title="Total Visits"
          value={stats.summary.total_visits}
        />
        <MetricCard 
          title="Total Orders"
          value={stats.summary.total_orders}
        />
        <MetricCard 
          title="Total Revenue"
          value={`KES ${stats.summary.total_revenue.toLocaleString()}`}
        />
        <MetricCard 
          title="Conversion Rate"
          value={`${stats.summary.conversion_rate.toFixed(2)}%`}
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
      <div className="top-performers">
        <h2>Top Performers</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Visits</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.top_performers.map(user => (
              <tr key={user.userId}>
                <td>{user.name}</td>
                <td>{user.visit_count}</td>
                <td>{user.order_count}</td>
                <td>KES {user.total_revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start Python API
cd analytics
pm2 start api_server.py --name analytics-api --interpreter python

# Start Node.js Backend
cd ../project
pm2 start npm --name backend -- run dev

# Save configuration
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
ExecStart=/path/to/ACCORDBACKEND/analytics/venv/bin/python api_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable analytics-api
sudo systemctl start analytics-api
```

## Troubleshooting

### Python API not responding
```bash
# Check if running
ps aux | grep api_server.py

# Check logs
tail -f analytics/logs/analytics.log

# Restart
pkill -f api_server.py
cd analytics && ./start-api.sh
```

### Connection refused
- Ensure Python API is running on port 5001
- Check firewall settings
- Verify PYTHON_API_URL in .env

### Data not updating
- Check MongoDB connection in Python
- Verify database permissions
- Check Python logs for errors

## Performance Tips

1. **Caching**: Results are cached in Python for 5 minutes (can be adjusted)
2. **Connection Pooling**: MongoDB connections are pooled
3. **Parallel Requests**: Flask uses threading for concurrent requests
4. **Timeout**: Set appropriate timeouts in Node.js proxy (30-60s)

## Next Steps

1. ✅ Start both services (Python + Node.js)
2. ✅ Test endpoints with Postman/curl
3. ✅ Integrate in frontend dashboard
4. ✅ Set up auto-refresh (every 30-60 seconds)
5. ✅ Deploy to production with PM2/systemd

---

**Now your admin dashboard has LIVE analytics! 🎉**
