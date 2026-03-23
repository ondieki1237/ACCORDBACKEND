# KMHFR API v2 - Quick Reference Card

**Base URL:** `http://localhost:4500/api/kmhfr/v2`

---

## 🚀 Quick Start

```bash
# Health check
curl http://localhost:4500/api/kmhfr/v2/health

# Get counties (cached)
curl http://localhost:4500/api/kmhfr/v2/geographic/counties

# Get facilities in Nairobi
curl "http://localhost:4500/api/kmhfr/v2/facilities/?county_code=001&page_size=50"
```

---

## 📋 Core Endpoints (Replace {ID} with actual ID)

### Facilities
- `GET /facilities/` - List with filters
- `GET /facilities/{id}` - Get by ID
- `GET /facilities/search/{query}` - Search
- `GET /facilities/{id}/contacts` - Get contacts
- `GET /facilities/{id}/equipment` - Get equipment
- `GET /facilities/{id}/officers` - Get officers
- `GET /facilities/{id}/hr` - Get human resources

### Metadata (Cached)
- `GET /metadata/facility-types` - Types
- `GET /metadata/keph-levels` - Service tiers
- `GET /metadata/owner-types` - Ownership
- `GET /metadata/operation-statuses` - Status
- `GET /metadata/job-titles` - Job titles
- `GET /metadata/owners` - Owners

### Services (Cached)
- `GET /services/` - All services
- `GET /services/categories` - Categories
- `GET /services/specialities` - Medical specialities

### Geographic (Cached)
- `GET /geographic/counties` - All counties
- `GET /geographic/constituencies` - Constituencies
- `GET /geographic/wards` - Wards
- `GET /geographic/county-boundaries/{id}` - GIS data

### Infrastructure (Cached)
- `GET /infrastructure/` - Equipment types
- `GET /infrastructure/categories` - Categories
- `GET /facilities/{id}/material` - Facility inventory

### Admin & CHU
- `GET /admin-offices/` - Admin offices
- `GET /chu/` - Community health units

---

## 🔍 Query Parameters

### Common Parameters
```
?page=1                     # Page number
?page_size=50               # Results per page (default: 50)
?ordering=name              # Sort field
?search=term                # Text search
```

### Facility Filters
```
?name=hospital              # Facility name
?code=12345                 # Facility code
?county_code=001            # County code
?facility_type=hospital     # Type filter
?keph_level=Level%204       # KEPH level
?is_regulated=true          # Regulated only
?open_whole_day=true        # 24/7 open
```

### Geographic Filters
```
?county={ID}                # Filter by county
?constituency={ID}          # Filter by constituency
?facility={ID}              # Filter by facility
```

---

## 💾 Cache & Sync

```bash
# View cache stats
GET /cache/stats

# Clear cache
POST /cache/clear

# Sync metadata to MongoDB
POST /sync/metadata

# View sync logs
GET /sync/logs
```

---

## 📊 Response Format

### Success
```json
{
  "data": [...],
  "count": 50
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## ⚡ Features

✅ **Auto-retry** - 3 attempts, exponential backoff  
✅ **Cached** - Metadata cached 1 hour  
✅ **Timeout** - All requests timeout at 10 seconds  
✅ **Robust** - Comprehensive error handling  
✅ **MongoDB** - Sync capability for offline access  

---

## 🧪 Testing

```bash
# Full test suite
node test-kmhfr-api.js

# Test one endpoint
curl http://localhost:4500/api/kmhfr/v2/health
```

---

## 📚 Full Documentation

See: `KMHFR_API_IMPLEMENTATION_COMPLETE.md`

---

## 🔗 External Resources

- **KMHFR:** https://kmhfr.health.go.ke
- **API Docs:** https://api.kmhfr.health.go.ke/api/docs/

---

**Legend**
- ✅ = Implemented
- 🔄 = Cached
- 🔒 = Requires auth (currently none)

**Last Updated:** March 19, 2026

