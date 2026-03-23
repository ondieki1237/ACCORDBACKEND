# KMHFR API Implementation - Complete Integration Guide

**Version:** 2.0.0  
**Date:** March 19, 2026  
**Base URL:** `http://localhost:4500/api/kmhfr/v2` (New) or `http://localhost:4500/api/kmhfr` (Legacy)

---

## Overview

Your ACCORD backend now has a **production-ready KMHFR API integration** featuring:

✅ **Robust Error Handling** - Automatic retries with exponential backoff  
✅ **In-Memory Caching** - Fast responses for metadata (1-hour TTL)  
✅ **MongoDB Integration** - Cache facility data for offline access  
✅ **Full API Coverage** - All KMHFR endpoints implemented  
✅ **Timeout Protection** - All requests timeout at 10 seconds  
✅ **Rate Limiting Ready** - Structure supports rate limiting  

---

## Architecture

### Service Layer (`src/services/kmhfr.service.js`)

Organized into 8 service domains:

```
facilitiesService          → Facility queries & details
metadataService           → Types, levels, statuses
infrastructureService     → Equipment & inventory
servicesService           → Healthcare services
geographicService         → Location data & boundaries
adminService             → Administrative offices
chuService               → Community health units
cacheService             → Cache management
```

### Data Models (`src/models/KMHFRFacility.js`)

- **KMHFRFacility** - Cache synced facility data
- **KMHFRMetadata** - Cache metadata for UI
- **KMHFRSyncLog** - Track sync operations

### Routes (`src/routes/kmhfr-v2.js`)

Organized endpoints:
- `/facilities/*` - Facility operations
- `/metadata/*` - Metadata endpoints
- `/infrastructure/*` - Equipment data
- `/services/*` - Healthcare services
- `/geographic/*` - Location data
- `/admin-offices/*` - Administrative data
- `/chu/*` - Community health units
- `/sync/*` - Database sync operations

---

## Quick Start

### 1. Test Health Check

```bash
curl http://localhost:4500/api/kmhfr/v2/health
```

Response:
```json
{
  "status": "ok",
  "data": {
    "message": "Health check successful"
  }
}
```

### 2. Get Counties

```bash
curl http://localhost:4500/api/kmhfr/v2/geographic/counties
```

### 3. Search Facilities in Nairobi

```bash
curl "http://localhost:4500/api/kmhfr/v2/facilities/?county_code=001&page_size=50"
```

### 4. Get Facility Details

```bash
curl "http://localhost:4500/api/kmhfr/v2/facilities/{FACILITY_ID}"
```

---

## Endpoints Reference

### FACILITIES

```
GET    /api/kmhfr/v2/facilities/                    # List with filters
GET    /api/kmhfr/v2/facilities/{id}               # Get by ID
GET    /api/kmhfr/v2/facilities/search/{query}    # Search
GET    /api/kmhfr/v2/facilities/{id}/contacts     # Get contacts
GET    /api/kmhfr/v2/facilities/{id}/equipment    # Get equipment
GET    /api/kmhfr/v2/facilities/{id}/officers     # Get officers
GET    /api/kmhfr/v2/facilities/{id}/hr           # Get HR data
```

**Facility Query Parameters:**
```
?name=term                    # Search by name
?code=123456                  # Facility code
?county_code=001              # County code
?facility_type=hospital       # Type filter
?keph_level=Level%204         # KEPH level
?is_regulated=true            # Regulated only
?open_whole_day=true          # 24/7 open
?page=1&page_size=50          # Pagination
?ordering=name                # Sort field
```

### METADATA (Cached - 1 Hour)

```
GET    /api/kmhfr/v2/metadata/facility-types       # Facility types
GET    /api/kmhfr/v2/metadata/keph-levels         # KEPH levels
GET    /api/kmhfr/v2/metadata/owner-types         # Owner types
GET    /api/kmhfr/v2/metadata/operation-statuses  # Operation status
GET    /api/kmhfr/v2/metadata/admission-statuses  # Admission status
GET    /api/kmhfr/v2/metadata/regulatory-bodies   # Regulatory bodies
GET    /api/kmhfr/v2/metadata/regulation-statuses # Regulation status
GET    /api/kmhfr/v2/metadata/job-titles          # Job titles
GET    /api/kmhfr/v2/metadata/owners              # Facility owners
```

### INFRASTRUCTURE & EQUIPMENT

```
GET    /api/kmhfr/v2/infrastructure/               # All equipment types
GET    /api/kmhfr/v2/infrastructure/categories    # Equipment categories
GET    /api/kmhfr/v2/facilities/{id}/material     # Facility inventory
```

**Query Parameters:**
```
?category={CATEGORY_ID}       # Filter by category
```

### SERVICES

```
GET    /api/kmhfr/v2/services/                # All services
GET    /api/kmhfr/v2/services/categories      # Service categories
GET    /api/kmhfr/v2/services/options         # Service options
GET    /api/kmhfr/v2/services/specialities     # Medical specialities
GET    /api/kmhfr/v2/services/specialities/categories
```

**Query Parameters:**
```
?category={ID}         # Filter by category
?keph_level={LEVEL}    # Filter by KEPH level
?service={SERVICE_ID}  # Filter options by service
```

### GEOGRAPHIC DATA

```
GET    /api/kmhfr/v2/geographic/counties                # All counties
GET    /api/kmhfr/v2/geographic/constituencies          # Constituencies
GET    /api/kmhfr/v2/geographic/wards                   # Wards
GET    /api/kmhfr/v2/geographic/towns                   # Towns
GET    /api/kmhfr/v2/geographic/addresses               # Physical addresses
GET    /api/kmhfr/v2/geographic/county-boundaries/{id}  # GIS data
GET    /api/kmhfr/v2/geographic/constituency-boundaries/{id}
GET    /api/kmhfr/v2/geographic/ward-boundaries/{id}
```

**Geographic Query Parameters:**
```
?county={ID}              # Filter by county
?constituency={ID}        # Filter by constituency
?facility={ID}            # Filter addresses by facility
```

### ADMINISTRATIVE OFFICES

```
GET    /api/kmhfr/v2/admin-offices/            # All admin offices
GET    /api/kmhfr/v2/admin-offices/{id}       # Get specific office
GET    /api/kmhfr/v2/admin-offices/{id}/contacts
```

**Query Parameters:**
```
?county={ID}       # Filter by county
?is_national=true  # National office only
```

### COMMUNITY HEALTH UNITS (CHU)

```
GET    /api/kmhfr/v2/chu/                  # All CHUs
GET    /api/kmhfr/v2/chu/facility-linkage  # CHU-facility links
GET    /api/kmhfr/v2/chu/ratings           # CHU ratings
```

**Query Parameters:**
```
?facility={ID}     # Filter by facility
?chu={ID}          # Filter linkage by CHU
```

### DATABASE SYNC

```
GET    /api/kmhfr/v2/sync/logs              # Get sync history
POST   /api/kmhfr/v2/sync/metadata          # Sync metadata to MongoDB
```

### CACHE MANAGEMENT

```
GET    /api/kmhfr/v2/cache/stats            # Cache statistics
POST   /api/kmhfr/v2/cache/clear            # Clear in-memory cache
```

---

## Response Format

### Success Response
```json
{
  "data": [...],
  "count": 50
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description here"
}
```

### Paginated Response
```json
{
  "count": 8547,
  "next": "https://api.kmhfr.health.go.ke/api/facilities/facilities/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Features

### 1. Automatic Retries

All requests automatically retry up to 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds

```javascript
// Internal retry logic (automatic)
async function retryRequest(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}
```

### 2. Intelligent Caching

**Metadata (1 hour cache):**
- Facility types, KEPH levels, owner types rarely change
- Cached in memory for fast responses
- Reduces external API calls

**Facility Data (No cache by default):**
- Fresh data on each request
- Optional MongoDB caching via sync endpoint

```javascript
// Get from cache first, then API
const data = await getPaginatedData(endpoint, params, true); // true = use cache
```

### 3. Timeout Protection

All requests timeout at **10 seconds** to prevent hanging:
```javascript
const API_TIMEOUT = 10000; // 10 seconds
```

### 4. MongoDB Integration

Sync metadata to MongoDB for offline access:
```bash
# Sync all metadata
POST /api/kmhfr/v2/sync/metadata

# Response
{
  "success": true,
  "total_records": 2547,
  "duration_ms": 5230
}
```

View sync logs:
```bash
GET /api/kmhfr/v2/sync/logs
```

---

## Usage Examples

### JavaScript/Node.js

```javascript
import { facilitiesService, metadataService } from './services/kmhfr.service.js';

// Get facilities in Nairobi
const facilities = await facilitiesService.getFacilities({
  county_code: '001',
  page_size: 100
});

// Search facilities
const results = await facilitiesService.searchFacilities('nairobi hospital');

// Get all services
const services = await servicesService.getServices();

// Get counties
const counties = await geographicService.getCounties();

console.log(`Found ${facilities.results.length} facilities`);
```

### Frontend Integration (React)

```typescript
// Fetch facilities
const response = await fetch('http://localhost:4500/api/kmhfr/v2/facilities/?page_size=50');
const data = await response.json();

// Get metadata
const typesResponse = await fetch('http://localhost:4500/api/kmhfr/v2/metadata/facility-types');
const types = await typesResponse.json();

// Use in state
setState({ facilities: data.results, facilityTypes: types.data });
```

### cURL Examples

```bash
# Get all Level 4 hospitals in Nairobi
curl "http://localhost:4500/api/kmhfr/v2/facilities/?county_code=001&keph_level=Level%204&page_size=100"

# Search for facilities
curl "http://localhost:4500/api/kmhfr/v2/facilities/search/kenyatta"

# Get facility details
curl "http://localhost:4500/api/kmhfr/v2/facilities/{FACILITY_ID}"

# Get services
curl "http://localhost:4500/api/kmhfr/v2/services/"

# Get geographic data
curl "http://localhost:4500/api/kmhfr/v2/geographic/counties"
```

---

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 404 | Facility not found | Verify facility ID exists in KMHFR |
| 500 | Failed to fetch | KMHFR API timeout - retries will attempt |
| 503 | KMHFR service unavailable | Check KMHFR status page |

### Retry Logic

- Automatic retries for 5xx errors
- Timeout (10s) may indicate slow KMHFR API
- Fallback to cached data when available

---

## Performance Tips

1. **Use pagination** - Default is 50, max ~200 per request
2. **Filter early** - Use query parameters to reduce results
3. **Cache metadata** - Sync to MongoDB once daily
4. **Batch requests** - Combine multiple queries if possible
5. **Monitor cache stats** - Use `/cache/stats` endpoint

---

## Database Sync Workflow

### Initial Setup

```bash
# 1. Sync all metadata to MongoDB
POST /api/kmhfr/v2/sync/metadata

# 2. Monitor sync
GET /api/kmhfr/v2/sync/logs
```

### Check MongoDB Collections

```javascript
// Query synced metadata
db.kmhfr_metadata.find({ type: "facility_types" })

// Query synced facilities
db.kmhfr_facilities.find({ county: "Nairobi" })

// View sync logs
db.kmhfr_sync_logs.find().sort({ _id: -1 }).limit(10)
```

---

## Advanced Features

### Geographic Queries

```javascript
// Get facility boundaries for mapping
const boundaries = await geographicService.getCountyBoundaries(countyId);

// Use with mapping library
map.addLayer({
  'id': 'counties',
  'type': 'fill',
  'source': {
    'type': 'geojson',
    'data': boundaries
  }
});
```

### Facility Targeting

```javascript
// Find high-value sales targets
const highValue = await facilitiesService.getFacilities({
  keph_level: 'Level 4',
  is_regulated: true,
  open_whole_day: true
});
```

### Hot Spots Analysis

```javascript
// Get facilities by zone
const nairobi = await facilitiesService.getFacilities({
  county_code: '001'
});

const facilities = nairobi.results.map(f => ({
  id: f.id,
  name: f.name,
  beds: f.number_of_beds,
  type: f.facility_type_name
}));
```

---

## Troubleshooting

### Cache Not Working

```bash
# Check cache stats
GET /api/kmhfr/v2/cache/stats

# Clear cache
POST /api/kmhfr/v2/cache/clear
```

### Slow Responses

- Check if KMHFR API is slow
- Review cache stats - metadata should be cached
- Monitor sync logs for issues

### Empty Results

- Verify query parameters are correct
- Check spelling and capitalization
- Use search endpoint for fuzzy matching

---

## Future Enhancements

- [ ] Add Redis caching for distributed systems
- [ ] Implement GraphQL interface
- [ ] Add webhook notifications for data updates
- [ ] Create bulk export endpoint
- [ ] Add analytics dashboard
- [ ] Implement predictive sync based on usage patterns

---

## Support & Resources

- **KMHFR Official:** https://kmhfr.health.go.ke
- **API Explorer:** https://api.kmhfr.health.go.ke/api/explore/
- **Swagger UI:** https://api.kmhfr.health.go.ke/api/docs/
- **Local Tests:** `/api/kmhfr/v2/*`

---

## Migration from Legacy Endpoints

Old endpoints (`/api/kmhfr/*`) still work for backward compatibility.

To migrate to new endpoints:

```bash
# Old
GET /api/kmhfr/health

# New
GET /api/kmhfr/v2/health
```

Both versions support the same parameters and response formats.

---

**Implementation Complete ✅**

All KMHFR API endpoints are now production-ready with robust error handling, caching, MongoDB integration, and comprehensive documentation.

