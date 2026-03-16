# Facility Creation API Documentation

## Overview
This document explains how to create and save new facilities/clients in the Accord Medical system.

---

## Quick Start

### Create a Facility (Simple Format)

```bash
curl -X POST http://localhost:4500/api/facilities \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hayat Pharmacy",
    "location": "Juba",
    "county": "Central Equatoria",
    "longitude": 31.3070,
    "latitude": -4.5521
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Facility created successfully",
  "data": {
    "_id": "63f8a1b2c3d4e5f6g7h8i9j0",
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [31.3070, -4.5521]
    },
    "properties": {
      "name": "Hayat Pharmacy",
      "location": "Juba",
      "county": "Central Equatoria",
      "amenity": "clinic",
      "healthcare": "clinic"
    },
    "createdAt": "2026-03-16T13:30:00Z"
  }
}
```

---

## API Endpoints

### Create Facility
**Save a new client/facility to the database**

#### Route
```
POST /api/facilities
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- ✅ Role Required: `admin` or `manager`

#### Request Body (Format 1: Simple)
Send basic facility information:

```json
{
  "name": "Hayat Pharmacy",
  "location": "Juba",
  "county": "Central Equatoria",
  "constituency": "Juba County",
  "longitude": 31.3070,
  "latitude": -4.5521
}
```

#### Request Body (Format 2: GeoJSON)
Or use full GeoJSON format:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [31.3070, -4.5521]
  },
  "properties": {
    "name": "Hayat Pharmacy",
    "location": "Juba",
    "county": "Central Equatoria",
    "amenity": "clinic",
    "healthcare": "clinic"
  }
}
```

#### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Facility name |
| `location` | String | No | Geographic location/town |
| `county` | String | No | County/province |
| `constituency` | String | No | Constituency/district |
| `longitude` | Number | No | GPS longitude coordinate |
| `latitude` | Number | No | GPS latitude coordinate |
| `amenity` | String | No | Facility type (default: "clinic") |
| `healthcare` | String | No | Healthcare category (default: "clinic") |

#### Response (Success - 201 Created)
```json
{
  "success": true,
  "message": "Facility created successfully",
  "data": {
    "_id": "63f8a1b2c3d4e5f6g7h8i9j0",
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [31.3070, -4.5521]
    },
    "properties": {
      "name": "Hayat Pharmacy",
      "location": "Juba",
      "county": "Central Equatoria",
      "amenity": "clinic",
      "healthcare": "clinic"
    },
    "createdAt": "2026-03-16T13:30:00Z",
    "updatedAt": "2026-03-16T13:30:00Z"
  }
}
```

#### Response (Error - Missing Name)
```json
{
  "success": false,
  "message": "Facility name is required",
  "requiredFields": ["name"]
}
```

#### Response (Error - Validation Failed)
```json
{
  "success": false,
  "message": "Validation error",
  "details": ["geometry is required", "properties is required"]
}
```

---

## Frontend Implementation Examples

### React Component - Create Facility Form

```javascript
import { useState } from 'react';

export function CreateFacilityForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    county: '',
    constituency: '',
    longitude: '',
    latitude: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('longitude') || name.includes('latitude') 
        ? parseFloat(value) || ''
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      
      // Remove empty fields
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '' && v !== null)
      );

      const response = await fetch('/api/facilities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Facility created:', result.data);
        // Clear form
        setFormData({
          name: '',
          location: '',
          county: '',
          constituency: '',
          longitude: '',
          latitude: ''
        });
        // Notify parent
        onSuccess?.(result.data);
      } else {
        setError(result.message || 'Failed to create facility');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="facility-form">
      <div className="form-group">
        <label htmlFor="name">Facility Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Hayat Pharmacy"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Juba"
        />
      </div>

      <div className="form-group">
        <label htmlFor="county">County</label>
        <input
          type="text"
          id="county"
          name="county"
          value={formData.county}
          onChange={handleChange}
          placeholder="e.g., Central Equatoria"
        />
      </div>

      <div className="form-group">
        <label htmlFor="constituency">Constituency</label>
        <input
          type="text"
          id="constituency"
          name="constituency"
          value={formData.constituency}
          onChange={handleChange}
          placeholder="e.g., Juba County"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="longitude">Longitude</label>
          <input
            type="number"
            id="longitude"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="e.g., 31.3070"
            step="0.0001"
          />
        </div>

        <div className="form-group">
          <label htmlFor="latitude">Latitude</label>
          <input
            type="number"
            id="latitude"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="e.g., -4.5521"
            step="0.0001"
          />
        </div>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Facility'}
      </button>

      {error && <div className="error-message">{error}</div>}
    </form>
  );
}
```

### JavaScript Fetch Example

```javascript
async function createFacility(facilityData) {
  const token = localStorage.getItem('accessToken');

  try {
    const response = await fetch('/api/facilities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: facilityData.name,
        location: facilityData.location,
        county: facilityData.county,
        longitude: parseFloat(facilityData.longitude),
        latitude: parseFloat(facilityData.latitude)
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Facility saved to database:', result.data);
      return result.data;
    } else {
      console.error('❌ Error:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Usage
createFacility({
  name: 'Hayat Pharmacy',
  location: 'Juba',
  county: 'Central Equatoria',
  longitude: 31.3070,
  latitude: -4.5521
});
```

---

## Common Issues & Solutions

### Problem: "Facility name is required"
**Cause:** The `name` field is empty or missing
**Solution:** Ensure the form has a name value before submitting

```javascript
// ❌ Wrong
createFacility({ location: 'Juba' })

// ✅ Correct
createFacility({ name: 'Hayat Pharmacy', location: 'Juba' })
```

### Problem: Data showing in form but not saved in database
**Cause:** Form data is in state/cache but POST request failed
**Solution:** Check the response status - if not 201, request failed

```javascript
if (response.status !== 201) {
  const result = await response.json();
  console.error('Save failed:', result.message);
}
```

### Problem: Coordinates not being saved
**Cause:** Longitude/latitude sent as strings instead of numbers
**Solution:** Convert to numbers before sending

```javascript
// ❌ Wrong
{ longitude: "31.3070", latitude: "-4.5521" }

// ✅ Correct
{ longitude: 31.3070, latitude: -4.5521 }
```

---

## Data Persistence

### Where Facilities Are Saved
All facilities are saved in MongoDB collection: `locations`

### How to Verify
1. Check the response has `_id` field (MongoDB document ID)
2. Call GET `/api/facilities` to list all facilities
3. Search for your facility by name

### List All Facilities
```bash
curl http://localhost:4500/api/facilities \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response shows all facilities in database:
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "63f8a1b2c3d4e5f6g7h8i9j0",
        "properties": { "name": "Hayat Pharmacy", ... },
        "geometry": { "type": "Point", "coordinates": [...] }
      }
      // ... more facilities
    ],
    "totalDocs": 506,
    "limit": 1000,
    "page": 1,
    "pages": 1
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 201 | Created | Facility successfully saved |
| 400 | Bad Request | Missing required field (name) |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Role not admin/manager |
| 500 | Server Error | Database error |

---

## Tips

✅ **Only fill required fields** - Other fields are optional  
✅ **Include coordinates if available** - Enables map features  
✅ **Use consistent naming** - Makes searching easier  
✅ **Verify success response** - Check `success: true` in response  
✅ **Save the returned `_id`** - Use this ID for future references

---

## Testing

### Using Postman

1. Set up authorization:
   - Tab: Authorization
   - Type: Bearer Token
   - Token: Your JWT token

2. Create new request:
   - Method: POST
   - URL: `http://localhost:4500/api/facilities`
   - Body (JSON):
     ```json
     {
       "name": "Test Pharmacy",
       "location": "Nairobi",
       "county": "Nairobi",
       "longitude": 36.8172,
       "latitude": -1.2865
     }
     ```

3. Send and verify:
   - Status: 201
   - Response includes `_id`
   - `success: true`

---

## Next Steps

After creating a facility, you can:
- ✅ Assign machines to the facility
- ✅ Schedule service visits
- ✅ Create reports for the facility
- ✅ Link contacts to the facility
