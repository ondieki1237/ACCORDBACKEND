# Daily Visits Reports API

## Overview
The Daily Visits Reports API allows administrators to view all sales team visits for a specific day, with filtering, pagination, and summary statistics.

## Endpoint

### Get Daily Visits Activities
**GET** `/api/admin/visits/daily/activities`

Fetch all visits from the sales team for a specific day with optional filtering.

#### Authentication
- **Required**: Yes (JWT Bearer Token)
- **Role**: Admin only

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | String (ISO Date) | No | Today | Target date to fetch visits for (e.g., "2025-11-17") |
| `page` | Number | No | 1 | Page number for pagination |
| `limit` | Number | No | 50 | Number of results per page |
| `region` | String | No | - | Filter by sales team region (e.g., "Nairobi", "Mombasa") |
| `userId` | String (ObjectId) | No | - | Filter by specific user ID |
| `outcome` | String | No | - | Filter by visit outcome (e.g., "successful", "follow-up", "unsuccessful") |

#### Response Format

```json
{
  "success": true,
  "data": [
    {
      "_id": "673a1234567890abcdef1234",
      "userId": {
        "_id": "672b9876543210fedcba9876",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@accordmedical.co.ke",
        "employeeId": "EMP001",
        "region": "Nairobi",
        "role": "sales"
      },
      "client": {
        "name": "Nairobi Hospital",
        "location": "Nairobi, Kenya"
      },
      "contacts": [
        {
          "name": "Dr. Smith",
          "position": "Head of Procurement",
          "phone": "+254712345678"
        }
      ],
      "visitOutcome": "successful",
      "date": "2025-11-17T08:30:00.000Z",
      "duration": 45,
      "totalPotentialValue": 150000,
      "notes": "Discussed new equipment requirements",
      "tags": ["equipment", "follow-up"],
      "createdAt": "2025-11-17T08:45:00.000Z"
    }
  ],
  "summary": {
    "totalVisits": 25,
    "date": "2025-11-17",
    "visitsByOutcome": {
      "successful": 15,
      "follow-up": 8,
      "unsuccessful": 2
    }
  },
  "meta": {
    "totalDocs": 25,
    "page": 1,
    "totalPages": 1,
    "limit": 50,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Response Fields

**Data Array:**
- `_id`: Visit unique identifier
- `userId`: User object containing sales person details
  - `_id`: User ID
  - `firstName`: User's first name
  - `lastName`: User's last name
  - `email`: User's email
  - `employeeId`: Employee ID
  - `region`: User's assigned region
  - `role`: User role (always "sales" for this endpoint)
- `client`: Client/facility information
- `contacts`: Array of contacts met during visit
- `visitOutcome`: Result of the visit
- `date`: Visit date and time
- `duration`: Visit duration in minutes
- `totalPotentialValue`: Potential value in KES
- `notes`: Visit notes
- `tags`: Array of tags

**Summary Object:**
- `totalVisits`: Total number of visits for the day
- `date`: Date being viewed (ISO format)
- `visitsByOutcome`: Breakdown of visits by outcome type

**Meta Object:**
- `totalDocs`: Total number of documents matching the query
- `page`: Current page number
- `totalPages`: Total number of pages
- `limit`: Results per page
- `hasNextPage`: Whether there are more pages
- `hasPrevPage`: Whether there are previous pages

## Example Requests

### Get Today's Visits
```bash
GET /api/admin/visits/daily/activities
Authorization: Bearer <admin_jwt_token>
```

### Get Visits for Specific Date
```bash
GET /api/admin/visits/daily/activities?date=2025-11-15
Authorization: Bearer <admin_jwt_token>
```

### Filter by Region
```bash
GET /api/admin/visits/daily/activities?region=Nairobi
Authorization: Bearer <admin_jwt_token>
```

### Filter by Outcome
```bash
GET /api/admin/visits/daily/activities?outcome=successful
Authorization: Bearer <admin_jwt_token>
```

### Filter by Specific User
```bash
GET /api/admin/visits/daily/activities?userId=672b9876543210fedcba9876
Authorization: Bearer <admin_jwt_token>
```

### Multiple Filters with Pagination
```bash
GET /api/admin/visits/daily/activities?date=2025-11-17&region=Mombasa&outcome=successful&page=2&limit=20
Authorization: Bearer <admin_jwt_token>
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'sales' is not authorized to access this route"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch daily visits activities"
}
```

## Use Cases

### 1. Daily Team Activity Dashboard
Display all sales team visits for the current day on an admin dashboard.

### 2. Regional Performance Monitoring
Monitor visits by region to assess regional sales activity.

### 3. Outcome Analysis
Track success rates by filtering and analyzing visits by outcome.

### 4. Individual Performance Review
Review a specific sales person's daily activities using the `userId` filter.

### 5. Historical Analysis
View visits for past dates to analyze trends and patterns.

## Notes

- **Date Filtering**: When no date is provided, the endpoint defaults to today's visits
- **Time Range**: Visits are filtered for the entire day (00:00:00 to 23:59:59)
- **Active Users Only**: Only visits from active sales users are included
- **Sales Team Only**: Filters are automatically applied to only include users with role "sales"
- **Pagination**: Large result sets are paginated; use the `meta` object to navigate pages
- **Summary Statistics**: The `summary` object provides quick insights without processing all paginated results

## Related Endpoints

- `GET /api/admin/visits/user/:userId` - Get all visits for a specific user
- `GET /api/admin/visits/summary` - Get visit summary per user
- `GET /api/admin/visits/:id` - Get single visit details
- `GET /api/visits` - User's own visits (sales team members)
