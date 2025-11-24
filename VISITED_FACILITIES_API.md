# Visited Facilities API

## Endpoint
`GET /api/facilities/visited`

## Description
Returns a list of unique facilities that the authenticated user has visited, based on their visit history.

## Authentication
Required. User must be authenticated with a valid JWT token.

## Request Headers
```
Authorization: Bearer <token>
```

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "name": "Nairobi Hospital",
      "type": "hospital",
      "level": "5",
      "location": "Nairobi",
      "visitCount": 3,
      "lastVisitDate": "2023-11-20T09:00:00.000Z",
      "firstVisitDate": "2023-10-15T09:00:00.000Z"
    },
    {
      "name": "Kenyatta National Hospital",
      "type": "hospital",
      "level": "6",
      "location": "Nairobi",
      "visitCount": 1,
      "lastVisitDate": "2023-11-18T09:00:00.000Z",
      "firstVisitDate": "2023-11-18T09:00:00.000Z"
    }
  ],
  "count": 2
}
```

### Error Response (500)
```json
{
  "success": false,
  "message": "Failed to retrieve visited facilities"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| name | String | Facility name |
| type | String | Facility type (hospital, clinic, pharmacy, etc.) |
| level | String | Facility level (1-6, not_applicable) |
| location | String | Facility location |
| visitCount | Number | Total number of visits to this facility |
| lastVisitDate | Date | Date of most recent visit |
| firstVisitDate | Date | Date of first visit |

## Notes
- Results are sorted by `lastVisitDate` in descending order (most recent first)
- Facilities are grouped by unique combination of name, type, level, and location
- Only returns facilities that the authenticated user has visited
