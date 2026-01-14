# Admin API - Analytics & Dashboard

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Sales Analytics by User](#sales-analytics-by-user)
3. [Examples](#examples)

---

## Overview

Analytics endpoints provide comprehensive insights into sales performance, customer engagement, and revenue metrics.

**Base Path**: `/api/admin/analytics`  
**Required Role**: `admin` only  
**Authentication**: Required (Bearer Token)

---

## Sales Analytics by User

Get detailed sales analytics for a specific user including visits, quotations, orders, revenue, and performance metrics.

### Endpoint

```http
GET /api/admin/analytics/sales/:userId
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User MongoDB ObjectId |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Filter from date (ISO format, default: beginning of time) |
| endDate | string | No | Filter until date (ISO format, default: now) |

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@accordmedical.co.ke",
      "role": "sales",
      "region": "Nairobi"
    },
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2026-01-06T23:59:59.999Z"
    },
    "summary": {
      "visitsCount": 145,
      "uniqueClients": 42,
      "quotationsRequested": 38,
      "ordersPlaced": 12,
      "revenue": 18500000,
      "avgDealSize": 1541667,
      "lastVisit": "2026-01-05T14:30:00.000Z"
    },
    "topClients": [
      {
        "_id": "client001",
        "name": "Nairobi General Hospital",
        "visits": 12
      },
      {
        "_id": "client002",
        "name": "Kenyatta National Hospital",
        "visits": 8
      },
      {
        "_id": "client003",
        "name": "Aga Khan Hospital",
        "visits": 6
      }
    ],
    "topProducts": [],
    "visits": [],
    "quotations": [
      {
        "_id": "quot123abc",
        "status": "responded",
        "total": 1200000,
        "createdAt": "2026-01-02T16:30:00.000Z",
        "items": [
          {
            "equipment": "Digital X-Ray System",
            "quantity": 1,
            "price": 1200000
          }
        ]
      },
      {
        "_id": "quot456def",
        "status": "pending",
        "total": 800000,
        "createdAt": "2026-01-04T10:15:00.000Z",
        "items": [
          {
            "equipment": "Chemistry Analyzer",
            "quantity": 1,
            "price": 800000
          }
        ]
      }
    ],
    "orders": [
      {
        "_id": "order001",
        "status": "completed",
        "total": 1200000,
        "createdAt": "2026-01-03T14:20:00.000Z",
        "items": [
          {
            "product": "Digital X-Ray System",
            "quantity": 1,
            "price": 1200000
          }
        ]
      }
    ],
    "timeSeries": [
      {
        "_id": "2025-01",
        "visits": 12
      },
      {
        "_id": "2025-02",
        "visits": 15
      },
      {
        "_id": "2025-03",
        "visits": 18
      },
      {
        "_id": "2025-12",
        "visits": 14
      },
      {
        "_id": "2026-01",
        "visits": 8
      }
    ]
  }
}
```

### Response Fields

**User Object:**
- `_id` - User MongoDB ObjectId
- `firstName` - User first name
- `lastName` - User last name
- `email` - User email address
- `role` - User role (sales, engineer, admin, manager)
- `region` - Assigned region/territory

**Period Object:**
- `startDate` - Analysis period start date
- `endDate` - Analysis period end date

**Summary Object:**
- `visitsCount` - Total customer visits in period
- `uniqueClients` - Number of unique clients visited
- `quotationsRequested` - Total quotation requests submitted
- `ordersPlaced` - Total orders/deals closed
- `revenue` - Total revenue generated (KES)
- `avgDealSize` - Average order value (KES)
- `lastVisit` - Date of most recent visit

**Top Clients:**
- Array of most frequently visited clients with visit counts

**Quotations:**
- Array of quotation objects with status, total, and items

**Orders:**
- Array of order objects with status, total, and items

**Time Series:**
- Monthly breakdown of visit activity

### Example Requests

```bash
# Get all-time analytics for user
curl -X GET "https://app.codewithseth.co.ke/api/admin/analytics/sales/user789" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get analytics for specific date range
curl -X GET "https://app.codewithseth.co.ke/api/admin/analytics/sales/user789?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get current year analytics
curl -X GET "https://app.codewithseth.co.ke/api/admin/analytics/sales/user789?startDate=2026-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get last 90 days analytics
START_DATE=$(date -d "90 days ago" +%Y-%m-%d)
curl -X GET "https://app.codewithseth.co.ke/api/admin/analytics/sales/user789?startDate=$START_DATE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Performance Indicators (KPIs)

### Sales Metrics

**Activity Metrics:**
- **Visits Count**: Total customer interactions
- **Unique Clients**: Number of different facilities visited
- **Visit Frequency**: Average visits per month

**Pipeline Metrics:**
- **Quotations Requested**: Number of quote requests submitted
- **Quote-to-Order Ratio**: Conversion rate from quotes to orders
- **Pipeline Value**: Total value of pending quotations

**Revenue Metrics:**
- **Orders Placed**: Number of deals closed
- **Total Revenue**: Sum of all order values
- **Average Deal Size**: Revenue / Orders Placed
- **Revenue Growth**: Period-over-period growth rate

**Client Metrics:**
- **Top Clients**: Most frequently engaged clients
- **Client Retention**: Repeat visit rate
- **New Clients**: First-time visits in period

---

## Examples

### JavaScript/Axios

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://app.codewithseth.co.ke/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Get user sales analytics
async function getUserAnalytics(userId, startDate = null, endDate = null) {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await api.get(`/admin/analytics/sales/${userId}`, { params });
  return response.data;
}

// Get current month analytics
async function getCurrentMonthAnalytics(userId) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endDate = now.toISOString();
  
  return getUserAnalytics(userId, startDate, endDate);
}

// Get last quarter analytics
async function getLastQuarterAnalytics(userId) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const endDate = now.toISOString();
  
  return getUserAnalytics(userId, startDate, endDate);
}

// Calculate conversion rates
async function getConversionMetrics(userId) {
  const analytics = await getUserAnalytics(userId);
  
  const quoteToOrderRate = analytics.data.summary.ordersPlaced / 
                           analytics.data.summary.quotationsRequested * 100;
  
  const visitToQuoteRate = analytics.data.summary.quotationsRequested / 
                           analytics.data.summary.visitsCount * 100;
  
  const visitToOrderRate = analytics.data.summary.ordersPlaced / 
                           analytics.data.summary.visitsCount * 100;
  
  return {
    quoteToOrderRate: quoteToOrderRate.toFixed(2) + '%',
    visitToQuoteRate: visitToQuoteRate.toFixed(2) + '%',
    visitToOrderRate: visitToOrderRate.toFixed(2) + '%'
  };
}

// Example usage
getUserAnalytics('user789', '2026-01-01', '2026-01-31')
  .then(data => {
    console.log('Total Visits:', data.data.summary.visitsCount);
    console.log('Total Revenue:', data.data.summary.revenue);
    console.log('Avg Deal Size:', data.data.summary.avgDealSize);
  })
  .catch(error => console.error('Error:', error));
```

### Python

```python
import requests
from datetime import datetime, timedelta

BASE_URL = "https://app.codewithseth.co.ke/api"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# Get user analytics
def get_user_analytics(user_id, start_date=None, end_date=None):
    params = {}
    if start_date:
        params["startDate"] = start_date
    if end_date:
        params["endDate"] = end_date
    
    response = requests.get(
        f"{BASE_URL}/admin/analytics/sales/{user_id}",
        headers=headers,
        params=params
    )
    return response.json()

# Get current month analytics
def get_current_month_analytics(user_id):
    now = datetime.now()
    start_date = datetime(now.year, now.month, 1).isoformat()
    end_date = now.isoformat()
    
    return get_user_analytics(user_id, start_date, end_date)

# Get last 90 days analytics
def get_last_90_days_analytics(user_id):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)
    
    return get_user_analytics(
        user_id,
        start_date.isoformat(),
        end_date.isoformat()
    )

# Calculate performance metrics
def calculate_performance_metrics(analytics):
    summary = analytics['data']['summary']
    
    # Conversion rates
    quote_to_order_rate = (summary['ordersPlaced'] / summary['quotationsRequested'] * 100) if summary['quotationsRequested'] > 0 else 0
    visit_to_quote_rate = (summary['quotationsRequested'] / summary['visitsCount'] * 100) if summary['visitsCount'] > 0 else 0
    
    # Efficiency metrics
    avg_visits_per_order = summary['visitsCount'] / summary['ordersPlaced'] if summary['ordersPlaced'] > 0 else 0
    
    return {
        'quote_to_order_rate': f"{quote_to_order_rate:.2f}%",
        'visit_to_quote_rate': f"{visit_to_quote_rate:.2f}%",
        'avg_visits_per_order': f"{avg_visits_per_order:.1f}",
        'revenue_per_visit': f"KES {summary['revenue'] / summary['visitsCount']:.2f}" if summary['visitsCount'] > 0 else "KES 0"
    }

# Example: Get and analyze user performance
user_id = "user789"
analytics = get_current_month_analytics(user_id)
metrics = calculate_performance_metrics(analytics)

print(f"User: {analytics['data']['user']['firstName']} {analytics['data']['user']['lastName']}")
print(f"Period: {analytics['data']['period']['startDate']} to {analytics['data']['period']['endDate']}")
print(f"\nSummary:")
print(f"  Visits: {analytics['data']['summary']['visitsCount']}")
print(f"  Orders: {analytics['data']['summary']['ordersPlaced']}")
print(f"  Revenue: KES {analytics['data']['summary']['revenue']:,.2f}")
print(f"  Avg Deal: KES {analytics['data']['summary']['avgDealSize']:,.2f}")
print(f"\nConversion Metrics:")
print(f"  Quote→Order: {metrics['quote_to_order_rate']}")
print(f"  Visit→Quote: {metrics['visit_to_quote_rate']}")
print(f"  Visits/Order: {metrics['avg_visits_per_order']}")
```

---

## Best Practices

### Analytics Usage

1. **Regular Monitoring**: Review analytics weekly for team performance
2. **Trend Analysis**: Compare month-over-month and year-over-year trends
3. **Goal Setting**: Use historical data to set realistic targets
4. **Territory Analysis**: Compare performance across regions
5. **Coaching Opportunities**: Identify low performers for training

### Performance Evaluation

1. **Multiple Metrics**: Don't rely on single KPI; use comprehensive view
2. **Context Matters**: Consider territory difficulty and seasonality
3. **Conversion Focus**: Track quote-to-order conversion rates
4. **Client Engagement**: Monitor visit frequency and client diversity
5. **Revenue Quality**: Analyze average deal size and order mix

### Reporting

1. **Date Ranges**: Use consistent periods for comparison (monthly, quarterly)
2. **Visualization**: Create charts from time series data
3. **Benchmarking**: Compare individual performance to team averages
4. **Action Items**: Identify specific improvement areas
5. **Documentation**: Record insights and follow-up actions

---

## Related Endpoints

- **User Management**: `GET /api/admin/users`
- **Visits**: `GET /api/admin/visits/user/:userId`
- **Reports**: `GET /api/admin/reports`
- **Quotations**: `GET /api/admin/quotations`

---

**[← Back to Consumables](./ADMIN_API_08_CONSUMABLES.md)** | **[Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)**
