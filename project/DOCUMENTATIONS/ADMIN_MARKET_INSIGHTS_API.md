# Admin Market Insights API Documentation

This API gives admins a powerful overview of market activity and sales opportunities, directly from visit data. Use it to analyze product demand, track sales performance, and identify follow-up opportunities.

## Intelligence Features

The API includes built-in data normalization and intelligence:

- **Case-insensitive grouping:** "Lab Consumables", "lab consumables", and "LAB CONSUMABLES" are merged into a single product.
- **Junk filtering:** The following values are automatically excluded from all aggregations and lists:
  - Empty strings, `none`, `nil`, `nill`, `n/a`, `na`, `null`
  - `-`, `.`, `no`, `nothing`, `not applicable`, `not available`
  - `unknown`, `undefined`, `n`, `non`
- **Title-case output:** Product and location names are displayed in clean title case (e.g., "Lab consumables").
- **Deduplication:** Unique facilities and locations are counted accurately after normalization.

---

## Endpoints

### 1. Get Visit Insights
`GET /api/admin/market-insights/visits`

**Authentication:** Requires admin role (JWT auth)

**Query Parameters (all optional):**
| Parameter    | Type   | Description                                   |
|--------------|--------|-----------------------------------------------|
| startDate    | string | Filter by visit date (start, YYYY-MM-DD)      |
| endDate      | string | Filter by visit date (end, YYYY-MM-DD)        |
| product      | string | Filter by product of interest name (partial)  |
| salesPerson  | string | Filter by sales person user ID                |
| location     | string | Filter by facility location (partial)         |
| outcome      | string | Filter by visit outcome                       |
| page         | number | Page number (default: 1)                      |
| limit        | number | Results per page (default: 100, max: 500)     |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "visitId": "60f7c2e5e6b3f2a1b8e4d123",
      "facility": "Facility Name",
      "facilityType": "hospital",
      "contactPerson": "Contact Name",
      "contactRole": "procurement",
      "contactPhone": "0712345678",
      "contactEmail": "contact@facility.com",
      "location": "Nairobi",
      "salesPerson": "John Doe",
      "salesPersonEmail": "john@company.com",
      "salesPersonId": "60f7c2e5e6b3f2a1b8e4d456",
      "date": "2026-03-01T00:00:00.000Z",
      "visitOutcome": "successful",
      "visitPurpose": "sales",
      "productsOfInterest": ["Ultrasound", "X-Ray Machine"],
      "notes": "Client interested in Q2 purchase"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3
  }
}
```

---

### 2. Get Product Insights (Aggregated)
`GET /api/admin/market-insights/products`

**Authentication:** Requires admin role (JWT auth)

**Query Parameters (optional):**
| Parameter    | Type   | Description                              |
|--------------|--------|------------------------------------------|
| startDate    | string | Filter by visit date (start, YYYY-MM-DD)|
| endDate      | string | Filter by visit date (end, YYYY-MM-DD)  |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "product": "Ultrasound",
      "count": 45,
      "uniqueFacilities": 32,
      "uniqueLocations": 12
    },
    {
      "product": "X-Ray Machine",
      "count": 38,
      "uniqueFacilities": 28,
      "uniqueLocations": 10
    }
  ]
}
```

---

### 3. Get Market Summary
`GET /api/admin/market-insights/summary`

**Authentication:** Requires admin role (JWT auth)

**Query Parameters (optional):**
| Parameter    | Type   | Description                              |
|--------------|--------|------------------------------------------|
| startDate    | string | Filter by visit date (start, YYYY-MM-DD)|
| endDate      | string | Filter by visit date (end, YYYY-MM-DD)  |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVisits": 250,
    "outcomes": [
      { "outcome": "successful", "count": 120 },
      { "outcome": "pending", "count": 80 },
      { "outcome": "followup_required", "count": 50 }
    ],
    "topProducts": [
      { "product": "Ultrasound", "count": 45 },
      { "product": "X-Ray Machine", "count": 38 }
    ],
    "topLocations": [
      { "location": "Nairobi", "count": 90 },
      { "location": "Mombasa", "count": 60 }
    ]
  }
}
```

---

## Example Requests

### Fetch all visits for March 2026
```
GET /api/admin/market-insights/visits?startDate=2026-03-01&endDate=2026-03-31
Authorization: Bearer <admin_jwt_token>
```

### Fetch visits for a specific product
```
GET /api/admin/market-insights/visits?product=Ultrasound
Authorization: Bearer <admin_jwt_token>
```

### Fetch product demand summary
```
GET /api/admin/market-insights/products?startDate=2026-01-01&endDate=2026-03-31
Authorization: Bearer <admin_jwt_token>
```

### Fetch market summary
```
GET /api/admin/market-insights/summary?startDate=2026-03-01&endDate=2026-03-31
Authorization: Bearer <admin_jwt_token>
```

---

## Client-Side Integration (React/JS)

### Fetch Visit Insights
```js
const fetchVisitInsights = async (startDate, endDate, page = 1) => {
  const params = new URLSearchParams({ startDate, endDate, page, limit: 50 });
  const res = await fetch(`/api/admin/market-insights/visits?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { data, meta } = await res.json();
  // data: array of visit insight records
  // meta: { page, limit, total, totalPages }
  return { data, meta };
};
```

### Fetch Product Insights
```js
const fetchProductInsights = async (startDate, endDate) => {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`/api/admin/market-insights/products?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { data } = await res.json();
  // data: array of { product, count, uniqueFacilities, uniqueLocations }
  return data;
};
```

### Fetch Market Summary
```js
const fetchMarketSummary = async (startDate, endDate) => {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`/api/admin/market-insights/summary?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { data } = await res.json();
  // data: { totalVisits, outcomes, topProducts, topLocations }
  return data;
};
```

---

## Use Cases

- **Market Analysis:** See which products are most requested, by which facilities, and by which sales people.
- **Sales Tracking:** Track daily/weekly/monthly visit outcomes and product demand.
- **Contact Follow-up:** Quickly find contact details for facilities interested in specific products.
- **Location Insights:** Identify top locations for sales activity and product demand.
- **Dashboard Cards:** Display total visits, top products, and top locations in an admin dashboard.
- **Export to Excel/CSV:** Use the data for further analysis or reporting.

---

## Frontend Integration Tips

- Display the insights in a table or dashboard.
- Allow filtering by date range, product, location, or outcome.
- Use pagination for large datasets.
- Enable export to Excel/CSV for further analysis.
- Use the product and summary endpoints for dashboard cards and charts.
- Use the data to drive sales strategy and follow-up actions.

---

**This API gives admins a powerful overview of market activity and sales opportunities, directly from visit data.**
