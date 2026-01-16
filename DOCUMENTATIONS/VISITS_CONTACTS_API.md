# Visits — Contacts & Mapping API

This endpoint returns a visit record enriched with the facility (if found in the locations collection), the list of contacts recorded during the visit, and any machine records matched to the "productsOfInterest" entries. The response is shaped for easy consumption by the frontend.

## Endpoint

GET /api/visits/:id/contacts-mapped

Requires authentication. Sales users can only fetch their own visits; managers/admins can fetch any.

### Headers

- `Authorization: Bearer <access_token>`

### Path Parameters

- `id` (string) — MongoDB ObjectId of the visit

### Response Structure

Success (200):

```json
{
  "success": true,
  "data": {
    "visitId": "603c...",
    "visitRef": "V20260116...",
    "date": "2026-01-16T08:30:00.000Z",
    "startTime": "2026-01-16T08:30:00.000Z",
    "endTime": "2026-01-16T09:10:00.000Z",
    "duration": 40,
    "client": {
      "name": "St Mary's Hospital",
      "type": "hospital",
      "level": "5",
      "location": "Nairobi"
    },
    "facility": { /* optional: location document from locations collection */ },
    "contacts": [
      {
        "name": "Dr. Alice",
        "role": "doctor",
        "phone": "+2547...",
        "email": "alice@stmarys.co.ke",
        "department": "Radiology",
        "notes": "Interested in demo",
        "followUpRequired": true,
        "followUpDate": null,
        "priority": "high"
      }
    ],
    "productsOfInterest": [
      {
        "product": { "name": "X-Ray Model 2000", "notes": "Looked promising" },
        "matchedMachine": { /* optional: machine document if found */ }
      }
    ],
    "existingEquipment": [ /* existing equipment array */ ],
    "notes": "General notes"
  }
}
```

If a `facility` is not found by exact name, the endpoint attempts a text-search fallback; if no match is found the `facility` field will be `null`.

For `productsOfInterest`, the endpoint attempts to match machines by text index first (if available), falling back to regex matching against `model`, `manufacturer`, and `facility.name`.

### Error Responses

- `401 Unauthorized` — missing/invalid token
- `403 Forbidden` — sales user requesting another user's visit
- `404 Not Found` — visit not found
- `500 Internal Server Error` — lookup error

### Example curl

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.example.com/api/visits/603c.../contacts-mapped
```

### Frontend mapping notes

- Use `data.client` for the displayed facility name and `data.facility` for richer address/geo metadata when present.
- Use `data.contacts` array to show personnel list; map `role` to UX-friendly titles if needed.
- Use `data.productsOfInterest[].matchedMachine` to pre-fill any machine details if the sales rep referenced equipment already in inventory.

---

If you want the endpoint to also return a list of fallback machine suggestions (multiple matches) instead of a single `matchedMachine`, I can update the route to return an array of candidates per product. Also I can add a small unit-test or a Postman collection entry if you want.
