# Admin Analytics API

This document describes the new analytics endpoints added to support the executive dashboard.

Base path: `/api/admin/analytics` (requires `admin` role)

## 1. Top Products

- **Endpoint:** `GET /api/admin/analytics/top-products`
- **Query params:** `startDate` (ISO), `endDate` (ISO), `limit` (default 5)
- **Description:** Aggregates orders to return best-selling consumables by units sold and revenue.

Response example:

```json
{
  "success": true,
  "data": [
    { "id": "607...", "name": "Blood Collection Tubes", "unitsSold": 1250, "revenue": 50000 },
    { "id": "608...", "name": "Surgical Gloves", "unitsSold": 850, "revenue": 12000 }
  ]
}
```

## 2. Sales Leaderboard — Representatives

- **Endpoint:** `GET /api/admin/analytics/leaderboard/reps`
- **Query params:** `startDate`, `endDate`, `metric` (`visits` | `revenue` | `leads`), `limit` (default 10)
- **Description:** Server-side aggregation for top-performing representatives.

Response example (visits):

```json
{
  "success": true,
  "data": [
    { "userId": "u1", "name": "John Doe", "count": 45 },
    { "userId": "u2", "name": "Jane Smith", "count": 38 }
  ]
}
```

For `revenue` the `revenue` field is returned (uses `Visit.totalPotentialValue` as a proxy). For `leads` the count is based on `Quotation.assignedTo`.

## 3. Top Facilities

- **Endpoint:** `GET /api/admin/analytics/leaderboard/facilities`
- **Query params:** `startDate`, `endDate`, `limit` (default 10)
- **Description:** Returns most visited facilities with visits count and last visit date.

Response example:

```json
{
  "success": true,
  "data": [
    { "name": "City Hospital", "location": "Nairobi", "visits": 12, "lastVisit": "2024-01-15T00:00:00Z" }
  ]
}
```

## 4. Revenue & Pipeline Metrics

- **Endpoint:** `GET /api/admin/analytics/revenue-summary`
- **Query params:** optional `startDate`, `endDate` (these apply to opportunity calculation)
- **Description:** Returns aggregated financial KPIs used on the dashboard.

Response example:

```json
{
  "success": true,
  "data": {
    "totalOpportunityValue": 500000,
    "closedRevenueThisMonth": 120000,
    "salesGrowth": 15
  }
}
```

Notes and caveats:
- `top-products` uses `Order.items` and `totalAmount`; orders created with the checkout flow will be included.
- `leaderboard/reps` uses `Visit` for `visits` and `revenue` (proxy) and `Quotation` for `leads`. If your orders store sales rep details in a custom field (e.g., `salesRep`), we can switch revenue aggregation to use orders per rep.
- `revenue-summary` computes `closedRevenueThisMonth` using orders with `paymentStatus: 'paid'` and compares to last month to compute `salesGrowth`.

If you want different metric sources (for example realtime revenue by rep from orders with `salesRep`), tell me where `salesRep` is stored in orders and I'll switch the aggregation accordingly.
