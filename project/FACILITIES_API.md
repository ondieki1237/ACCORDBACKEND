# Facilities API Documentation

This document describes the API endpoints for searching, retrieving, and creating facility records in the Accord Medical backend.

## Model: Facility
- Each facility document is based on a GeoJSON Feature structure:
  - `type`: "Feature"
  - `properties`: object (name, amenity, healthcare, etc.)
  - `geometry`: object (GeoJSON Point, coordinates)

## Endpoints

### 1. Search Facilities (Typeahead)
**GET** `/api/facilities?search=<query>&limit=<n>&page=<n>`

- **Description:**
  - Returns a paginated list of facilities matching the search query (full-text search on all indexed fields).
  - Designed for typeahead/autocomplete in forms.
- **Query Parameters:**
  - `search` (string, optional): Search term (matches name, amenity, etc.)
  - `limit` (number, optional): Max results per page (default: 10)
  - `page` (number, optional): Page number (default: 1)
- **Response:**
```json
{
  "docs": [
    {
      "_id": "...",
      "type": "Feature",
      "properties": { "name": "...", ... },
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      ...
    }
  ],
  "totalDocs": 1895,
  "limit": 10,
  "page": 1,
  "totalPages": 190,
  ...
}
```
- **Auth:**
  - By default, requires authentication. (Can be made public if needed.)

### 2. Get Facility by ID
**GET** `/api/facilities/:id`

- **Description:**
  - Returns a single facility document by its MongoDB ObjectId.
- **Response:**
```json
{
  "_id": "...",
  "type": "Feature",
  "properties": { ... },
  "geometry": { ... },
  ...
}
```
- **Auth:**
  - Requires authentication.

### 3. Create Facility (Admin)
**POST** `/api/facilities`

- **Description:**
  - Creates a new facility document. (Admin only)
- **Body:**
```json
{
  "type": "Feature",
  "properties": { "name": "...", ... },
  "geometry": { "type": "Point", "coordinates": [lng, lat] }
}
```
- **Response:**
  - The created facility document.
- **Auth:**
  - Requires admin authentication.

## Example Usage

### Typeahead (Frontend)
```js
// React Query example
const { data } = useQuery(['facilities', search], () =>
  fetch(`/api/facilities?search=${encodeURIComponent(search)}&limit=10`).then(res => res.json())
);
```

### Fetch by ID
```js
fetch('/api/facilities/656e...').then(res => res.json());
```

## Notes
- The facilities collection is indexed for text search (name, amenity, etc.).
- Geometry is stored as GeoJSON Point.
- For bulk import, use MongoDB Compass or mongoimport as described above.
- If you want to make the search endpoint public, change the middleware in `src/routes/facilities.js` from `authenticate` to `optionalAuth` or remove auth for GET.

---

For further customization or frontend integration, see the backend implementation in:
- `src/models/Facility.js`
- `src/controllers/facilitiesController.js`
- `src/routes/facilities.js`
