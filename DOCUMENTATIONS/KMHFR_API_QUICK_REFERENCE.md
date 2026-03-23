# KMHFR API Quick Reference - All Public Endpoints

**Base URL:** `https://api.kmhfr.health.go.ke/api/`

All endpoints below are publicly accessible without authentication (GET requests).

---

## FACILITIES (PRIMARY RESOURCES)

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/facilities/facilities/` | GET | List all health facilities | Pagination of 50+ fields per facility |
| `/facilities/facilities/{id}/` | GET | Get specific facility details | All facility information |
| `/facilities/facility_types/` | GET | List facility types/classifications | Hospital, PHC, Clinic, etc. |
| `/facilities/operation_statuses/` | GET | List operational statuses | Operational, Non-operational, Closed |
| `/facilities/admission_statuses/` | GET | List admission statuses | Open, Occupancy status |
| `/facilities/regulatory_bodies/` | GET | List regulatory bodies | KMPDB, KMTC, etc. |
| `/facilities/regulation_statuses/` | GET | List regulation statuses | Licensed, Provisional, Unlicensed |

---

## FACILITY METADATA

| Endpoint | Method | Purpose | Key Data |
|----------|--------|---------|----------|
| `/facilities/keph/` | GET | KEPH levels (service tiers) | Level 1-5 classifications |
| `/facilities/owner_types/` | GET | Facility ownership types | Public, Private, NGO, Faith-based |
| `/facilities/owners/` | GET | Specific facility owners | Ministry of Health, Private companies |
| `/facilities/job_titles/` | GET | Healthcare job titles | Doctor, Nurse, Lab Tech |

---

## EQUIPMENT & INFRASTRUCTURE

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/facilities/infrastructure/` | GET | All equipment types/categories | Oxygen, Ventilators, Dialysis machines |
| `/facilities/material/` | GET | Flattened facility equipment view | Equipment inventory per facility |
| `/facilities/infrastructure_categories/` | GET | Equipment categories | Medical Equipment, Utilities, etc. |

**Query Parameters:**
```
?page_size=100
?category=UUID
?facility=UUID
```

---

## SERVICES & SPECIALITIES

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/facilities/services/` | GET | Healthcare services | Lab, Surgery, Maternity, etc. |
| `/facilities/service_categories/` | GET | Service groupings | Diagnostic, Surgical, Maternal |
| `/facilities/service_options/` | GET | Service specific options | Treatment types, test types |
| `/facilities/specialities/` | GET | Medical specialties | Cardiology, Neurosurgery, etc. |
| `/facilities/speciality_categories/` | GET | Specialty groupings | Internal Medicine, Surgery, etc. |

---

## FACILITY INFORMATION

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/facilities/contacts/` | GET | Facility contact information | Phone, Email, Contact names |
| `/facilities/officers/` | GET | Facility officers/leadership | Names, titles, contacts |
| `/facilities/humanresources/` | GET | Human resources data | Staff counts by role |

**Query Parameters:**
```
?facility=UUID
?page_size=100
```

---

## COMMUNITY HEALTH UNITS (CHU)

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/chul/chu_ratings/` | GET | CHU ratings/reviews | Ratings, reviews, linked facilities |
| `/chul/chu/` | GET | Community health units list | CHU information, linked facilities |
| `/chul/chul_facility_linkage/` | GET | CHU to facility links | Which CHU serves which facilities |

---

## GEOGRAPHIC/ADMINISTRATIVE

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/common/counties/` | GET | Kenyan counties | County names, codes |
| `/common/constituencies/` | GET | Constituencies | Constituency names, county mapping |
| `/common/wards/` | GET | Wards | Ward names, constituency mapping |
| `/common/towns/` | GET | Towns/cities | Location names |
| `/common/address/` | GET | Physical addresses | Landmarks, plot numbers |
| `/gis/constituency_bound/` | GET | Constituency boundaries | GIS polygon data for mapping |
| `/gis/county_bound/` | GET | County boundaries | GIS polygon data |
| `/gis/ward_bound/` | GET | Ward boundaries | GIS polygon data |

---

## ADMINISTRATIVE OFFICES

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/admin_offices/` | GET | Regional health offices | Department contacts, locations |
| `/admin_offices/{id}/` | GET | Specific admin office | Full details, contacts |
| `/admin_office_contacts/` | GET | Admin office contacts | Physical/contact information |

---

## REPORTS & STATISTICS

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/reporting/` | GET | Report entry point | Available reports |
| `/reporting/chul/` | GET | CHU linkage reports | Stats on CHU-facility linkage |
| `/reporting/upgrades_downgrades/` | GET | Facility level changes | Upgrade/downgrade history |

---

## PAGINATION & FILTERING

### All endpoints support:
```
?page=1                    # Page number
?page_size=100             # Results per page (default 20)
?ordering=name             # Sort ascending
?ordering=-name            # Sort descending (reverse)
?search=nairobi            # Text search
```

### Common Query Filters:
```
?name=Hospital             # Facility name
?code=12345               # Facility code
?county=UUID              # County ID
?county_code=001          # County code
?constituency=UUID        # Constituency ID
?ward=UUID                # Ward ID
?facility_type=UUID       # Facility type
?owner=UUID               # Facility owner
?is_regulated=true        # Regulated facilities only
?is_published=true        # Published facilities
?open_whole_day=true      # 24/7 open
?deleted=false            # Not deleted records
?active=true              # Active records
```

---

## RESPONSE FORMAT

### Standard Paginated Response:
```json
{
  "count": 8547,
  "next": "https://api.kmhfr.health.go.ke/api/facilities/facilities/?page=2",
  "previous": null,
  "results": [
    { /* data objects */ }
  ]
}
```

### Error Response:
```json
{
  "detail": "Not found.",
  "status_code": 404
}
```

---

## HTTP STATUS CODES

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success - data returned |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limited - wait and retry |
| 500 | Server Error | Try again later |

---

## QUICK API CALLS

### cURL Examples

**Get all facilities in Nairobi:**
```bash
curl "https://api.kmhfr.health.go.ke/api/facilities/facilities/?county_code=001&page_size=100"
```

**Get specific facility by code:**
```bash
curl "https://api.kmhfr.health.go.ke/api/facilities/facilities/?code=12345"
```

**Get all hospitals:**
```bash
curl "https://api.kmhfr.health.go.ke/api/facilities/facilities/?facility_type=hospital&page_size=100"
```

**Get Level 4 facilities:**
```bash
curl "https://api.kmhfr.health.go.ke/api/facilities/facilities/?keph_level=level_4&page_size=100"
```

**Get all services:**
```bash
curl "https://api.kmhfr.health.go.ke/api/facilities/services/?page_size=500"
```

**Get equipment/infrastructure:**
```bash
curl "https://api.kmhfr.health.go.ke/api/facilities/infrastructure/?page_size=500"
```

**Get facility contacts:**
```bash
curl "https://api.kmhfr.health.go.ke/api/facilities/contacts/?facility=FACILITY_UUID"
```

**Get admin offices by county:**
```bash
curl "https://api.kmhfr.health.go.ke/api/admin_offices/?county=COUNTY_UUID"
```

**Get counties:**
```bash
curl "https://api.kmhfr.health.go.ke/api/common/counties/"
```

---

## JavaScript/Fetch Template

```javascript
const BASE_URL = "https://api.kmhfr.health.go.ke/api";

// Generic fetch function
async function fetchFromAPI(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Usage examples:
await fetchFromAPI("/facilities/facilities/", { 
  county_code: "001", 
  page_size: 50 
});

await fetchFromAPI("/facilities/keph/");

await fetchFromAPI("/facilities/services/", { 
  page_size: 500 
});
```

---

## Python requests Template

```python
import requests
from typing import Dict, List, Any

BASE_URL = "https://api.kmhfr.health.go.ke/api"
TIMEOUT = 30
HEADERS = {"Accept": "application/json"}

def fetch_from_api(endpoint: str, params: Dict = None) -> Dict:
    """Generic API fetch with error handling"""
    url = f"{BASE_URL}{endpoint}"
    params = params or {}
    
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API Error ({endpoint}): {e}")
        raise

# Usage examples:
data = fetch_from_api("/facilities/facilities/", {"county_code": "001", "page_size": 50})
counties = fetch_from_api("/common/counties/")
services = fetch_from_api("/facilities/services/", {"page_size": 500})
```

---

## Data Model Relationships

```
Facility
├── facility_type (FK) → FacilityType
├── owner (FK) → Owner
│   └── owner_type (FK) → OwnerType
├── keph_level (FK) → KephLevel
├── operation_status (FK) → OperationStatus
├── regulatory_body (FK) → RegulatoryBody
├── county (FK) → County
├── constituency (FK) → Constituency
├── ward (FK) → Ward
├── contacts (M2M) → Contact
├── services (M2M) → Service
│   └── service_category (FK) → ServiceCategory
└── infrastructure (M2M) → Infrastructure
    └── category (FK) → InfrastructureCategory

Officer/Staff
├── facility (FK) → Facility
└── job_title (FK) → JobTitle

CommunityHealthUnit (CHU)
├── facility (FK) → Facility
└── linked_facilities (M2M) → Facility

AdminOffice
├── county (FK) → County
└── contacts → Contact
```

---

## Performance Tips

1. **Use page_size parameter:** 
   - Default is ~20, increase to 100-500 for bulk operations
   - Don't use extremely large values (>1000)

2. **Filter early, fetch less:**
   ```
   DON'T: Fetch all facilities then filter
   DO:    ?county_code=001&facility_type=hospital&keph_level=level_4
   ```

3. **Cache responses:**
   - Facility types, KEPH levels, owner types rarely change
   - Cache for 24 hours minimum

4. **Batch process with pagination:**
   ```javascript
   for (let page = 1; page <= totalPages; page++) {
     const data = await fetch(`...?page=${page}`);
   }
   ```

5. **Use pagination next/previous URLs:**
   - More reliable than calculating page numbers

---

## Common Use Cases & Suggested Endpoints

### Identify High-Value Sales Targets
```
1. /facilities/keph/ → Filter Level 3, 4
2. /facilities/facilities/ → Filter by level, >100 beds, regulated
3. /facilities/contacts/ → Get contact info
4. /facilities/infrastructure/ → Determine equipment needs
```

### Build Regional Sales Map
```
1. /common/counties/ → Get all counties
2. /common/constituencies/ → Get administrative divisions
3. /facilities/facilities/ → Get facilities with coordinates
4. /gis/county_bound/ → Get map boundaries
```

### Find Equipment Procurement Gaps
```
1. /facilities/keph/ → Identify facility tier
2. /facilities/infrastructure/ → Get standard equipment
3. /facilities/material/ → Get current inventory
4. Compare and identify gaps
```

### Create Customer Database
```
1. /facilities/facilities/
2. /facilities/contacts/
3. /admin_offices/
4. /admin_office_contacts/
5. Export to CRM
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 errors | Verify UUIDs, use search endpoint first |
| 429 (rate limited) | Reduce page_size, add delays between requests |
| Empty results | Check spelling, try broader filters |
| Timeout errors | Increase timeout, reduce page_size |

---

## Rate Limiting

- Check response headers for `X-RateLimit-*` information
- Implement exponential backoff for retries
- Consider caching frequently accessed data
- For bulk operations, use 1-2 second delays between requests

---

## Documentation Links

- **Interactive API Explorer:** https://api.kmhfr.health.go.ke/api/explore/
- **Swagger UI:** https://api.kmhfr.health.go.ke/api/docs/
- **Schema Reference:** https://api.kmhfr.health.go.ke/api/schema/
