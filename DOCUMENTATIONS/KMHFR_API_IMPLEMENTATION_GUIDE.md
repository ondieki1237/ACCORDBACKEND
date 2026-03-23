# KMHFR API Implementation Guide for Medical Equipment Suppliers
**Focus: Public Read-Only Endpoints (No Authentication Required)**

**Base URL:** `https://api.kmhfr.health.go.ke/api/`

---

## Table of Contents
1. [Core Facility Endpoints](#core-facility-endpoints)
2. [Facility Metadata](#facility-metadata)
3. [Equipment & Infrastructure](#equipment--infrastructure)
4. [Services & Capabilities](#services--capabilities)
5. [Location & Geographic Data](#location--geographic-data)
6. [Administrative Offices](#administrative-offices)
7. [Authentication (Optional for Write Operations)](#authentication-optional-for-write-operations)
8. [Implementation Examples](#implementation-examples)
9. [Error Handling](#error-handling)

---

## CORE FACILITY ENDPOINTS

### 1. **Get All Facilities**
**Endpoint:** `GET /facilities/facilities/`

**Purpose:** List all health facilities in Kenya with detailed information.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Facility name (partial match) |
| `code` | string | Facility code (comma-separated) |
| `facility_type` | string | Facility type ID (comma-separated) |
| `county` | string | County ID (comma-separated) |
| `county_code` | string | County code (comma-separated) |
| `constituency` | string | Constituency ID (comma-separated) |
| `ward` | string | Ward ID (comma-separated) |
| `owner` | string | Owner ID (comma-separated) |
| `operation_status` | string | Operation status ID (comma-separated) |
| `is_regulated` | boolean | Regulated facilities only |
| `is_published` | boolean | Published facilities only |
| `open_whole_day` | boolean | Open 24/7 |
| `page` | integer | Page number |
| `page_size` | integer | Results per page |
| `ordering` | string | Sort field (e.g., `name`, `-created`) |

**Response Sample:**
```json
{
  "count": 8547,
  "next": "https://api.kmhfr.health.go.ke/api/facilities/facilities/?page=2",
  "previous": null,
  "results": [
    {
      "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
      "name": "Nairobi General Hospital",
      "code": "12345",
      "official_name": "Nairobi General Hospital - Teaching",
      "facility_type": "UUID",
      "facility_type_name": "Tertiary Hospital",
      "county": "UUID",
      "county_name": "Nairobi",
      "constituency_name": "Westlands",
      "ward_name": "Kilimani",
      "keph_level_name": "Level 4",
      "owner": "UUID",
      "owner_name": "Ministry of Health",
      "owner_type_name": "Public",
      "operation_status_name": "Operational",
      "number_of_beds": 1200,
      "number_of_cots": 50,
      "number_of_inpatient_beds": 800,
      "open_whole_day": true,
      "open_weekends": true,
      "open_public_holidays": true,
      "lat_long": "-1.2921,36.8219",
      "average_rating": "4.5",
      "is_approved": true,
      "is_complete": true,
      "description": "Government teaching hospital"
    }
  ]
}
```

---

## FACILITY METADATA

### 2. **Get Facility Types**
**Endpoint:** `GET /facilities/facility_types/`

**Purpose:** Get all facility types and classifications.

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Hospital",
      "abbreviation": "HSP",
      "description": "General Hospital",
      "category": "UUID",
      "parent": null,
      "is_facility_level": true
    },
    {
      "id": "UUID",
      "name": "Primary Health Center",
      "abbreviation": "PHC",
      "description": "Community Health Center",
      "parent": "UUID"
    }
  ]
}
```

### 3. **Get KEPH Levels**
**Endpoint:** `GET /facilities/keph/`

**Purpose:** Get Kenya Essential Package for Health (KEPH) levels. Define facility tier and service requirements.

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Level 1",
      "description": "Community Health Volunteers",
      "is_facility_level": true
    },
    {
      "id": "UUID",
      "name": "Level 2",
      "description": "Primary Health Center"
    },
    {
      "id": "UUID",
      "name": "Level 3",
      "description": "Sub-county Hospital"
    },
    {
      "id": "UUID",
      "name": "Level 4",
      "description": "Tertiary Hospital"
    }
  ]
}
```

### 4. **Get Owner Types**
**Endpoint:** `GET /facilities/owner_types/`

**Purpose:** Get facility ownership types (public, private, NGO, etc.).

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Ministry of Health",
      "abbreviation": "MOH",
      "description": "Government facilities"
    },
    {
      "id": "UUID",
      "name": "Private",
      "abbreviation": "PVT",
      "description": "Privately owned"
    },
    {
      "id": "UUID",
      "name": "NGO",
      "abbreviation": "NGO",
      "description": "Non-governmental organizations"
    }
  ]
}
```

### 5. **Get Operation Status**
**Endpoint:** `GET /facilities/operation_statuses/`

**Purpose:** Get facility operational status (operational, non-operational, closed, etc.).

---

## EQUIPMENT & INFRASTRUCTURE

### 6. **Get Infrastructure Categories & Items**
**Endpoint:** `GET /facilities/infrastructure/`

**Purpose:** Get all medical equipment, utilities, and infrastructure available at facilities.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Infrastructure category ID |
| `page_size` | integer | Results per page |

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Oxygen Concentrator",
      "abbreviation": "O2C",
      "description": "Medical oxygen supply system",
      "category_name": "Medical Equipment",
      "numbers": true,
      "code": "12345"
    },
    {
      "id": "UUID",
      "name": "Dialysis Machine",
      "category_name": "Specialized Equipment",
      "numbers": true
    },
    {
      "id": "UUID",
      "name": "Generator",
      "category_name": "Utilities",
      "numbers": true
    },
    {
      "id": "UUID",
      "name": "Water Tank",
      "category_name": "Utilities"
    }
  ]
}
```

**Infrastructure Sample Categories:**
- Medical Equipment (Oxygen concentrators, ventilators, dialysis machines)
- Laboratory Equipment (Analyzers, microscopes, incubators)
- Imaging Equipment (X-ray, Ultrasound, CT scanner)
- Utilities (Generator, Water tank, Solar panels)

### 7. **Get Infrastructure by Facility (Flattened View)**
**Endpoint:** `GET /facilities/material/`

**Purpose:** Get complete equipment inventory for a specific facility in flattened format.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `facility` | UUID | Facility ID |
| `county` | UUID | Filter by county |

**Response Sample:**
```json
{
  "results": [
    {
      "code": 12345,
      "name": "Nairobi General Hospital",
      "keph_level_name": "Level 4",
      "facility_type_name": "Tertiary Hospital",
      "county_name": "Nairobi",
      "owner_name": "Ministry of Health",
      "beds": 1200,
      "cots": 50,
      "open_whole_day": true,
      "services": ["UUID1", "UUID2", "UUID3"],
      "service_names": [
        "Oncology",
        "Cardiology",
        "Neurosurgery"
      ],
      "categories": ["UUID1", "UUID2"]
    }
  ]
}
```

---

## SERVICES & CAPABILITIES

### 8. **Get Services**
**Endpoint:** `GET /facilities/services/`

**Purpose:** Get all healthcare services offered by facilities.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Service category ID |
| `keph_level` | string | KEPH level filter |

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Oncology",
      "abbreviation": "ONC",
      "description": "Cancer treatment services",
      "category_name": "Specialized Services",
      "keph_level_name": "Level 4",
      "has_options": true
    },
    {
      "id": "UUID",
      "name": "Maternity Services",
      "category_name": "Maternal/Child Health",
      "keph_level_name": "Level 2"
    },
    {
      "id": "UUID",
      "name": "Laboratory",
      "category_name": "Diagnostic Services",
      "keph_level_name": "Level 2"
    },
    {
      "id": "UUID",
      "name": "Imaging (X-ray)",
      "category_name": "Diagnostic Services"
    }
  ]
}
```

### 9. **Get Service Categories**
**Endpoint:** `GET /facilities/service_categories/`

**Purpose:** Get service categories grouping related healthcare services.

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Diagnostic Services",
      "description": "Lab, imaging, and diagnostic tests"
    },
    {
      "id": "UUID",
      "name": "Maternal/Child Health",
      "description": "Maternity and pediatric services"
    },
    {
      "id": "UUID",
      "name": "Surgical Services",
      "description": "General and specialized surgery"
    }
  ]
}
```

### 10. **Get Specialities**
**Endpoint:** `GET /facilities/specialities/`

**Purpose:** Get medical specialties available.

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Cardiology",
      "category_name": "Internal Medicine"
    },
    {
      "id": "UUID",
      "name": "Orthopedics",
      "category_name": "Surgery"
    },
    {
      "id": "UUID",
      "name": "Pediatrics",
      "category_name": "Child Health"
    }
  ]
}
```

---

## LOCATION & GEOGRAPHIC DATA

### 11. **Get Geographic Data**
**Endpoint:** `GET /gis/constituency_bound/{id}/`

**Purpose:** Retrieve constituency boundary data for mapping.

**Response Sample:**
```json
{
  "id": "UUID",
  "county": "UUID",
  "constituency_name": "Westlands",
  "bound": "MULTIPOLYGON(((36.7 -1.23, 36.8 -1.23, ...)))"
}
```

### 12. **Get Counties**
**Endpoint:** `GET /common/counties/`

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Nairobi",
      "code": "001"
    },
    {
      "id": "UUID",
      "name": "Mombasa",
      "code": "002"
    }
  ]
}
```

### 13. **Get Constituencies**
**Endpoint:** `GET /common/constituencies/`

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Westlands",
      "county": "UUID",
      "code": "01001"
    }
  ]
}
```

### 14. **Get Wards**
**Endpoint:** `GET /common/wards/`

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Kilimani",
      "constituency": "UUID",
      "code": "01001001"
    }
  ]
}
```

### 15. **Get Physical Addresses**
**Endpoint:** `GET /common/address/`

**Purpose:** Get facility physical addresses with landmarks.

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "nearest_landmark": "Near Westgate Mall",
      "plot_number": "123/A",
      "location_desc": "Opposite Nairobi Hospital",
      "town_name": "Nairobi"
    }
  ]
}
```

---

## FACILITY CONTACTS

### 16. **Get Facility Contacts**
**Endpoint:** `GET /facilities/contacts/`

**Purpose:** Get contact information for facilities (phone, email, person names).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `facility` | UUID | Facility ID |

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "facility": "UUID",
      "contact_type": "Phone",
      "actual_contact": "+254-20-2726300",
      "contact_name": "Main Reception",
      "active": true
    },
    {
      "id": "UUID",
      "facility": "UUID",
      "contact_type": "Email",
      "actual_contact": "info@nahospital.org"
    }
  ]
}
```

---

## ADMINISTRATIVE OFFICES

### 17. **Get Admin Offices**
**Endpoint:** `GET /admin_offices/`

**Purpose:** Get regional health administrative offices for procurement coordination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `county` | UUID | County ID |
| `is_national` | boolean | National office |

**Response Sample:**
```json
{
  "results": [
    {
      "id": "UUID",
      "name": "Nairobi County Health Office",
      "county_name": "Nairobi",
      "sub_county_name": "Nairobi Central",
      "email": "health@nairobi.go.ke",
      "phone_number": "+254-20-3000000",
      "is_national": false,
      "contacts": [
        {
          "contact_type": "Email",
          "contact": "procurement@nairobi.go.ke"
        }
      ]
    }
  ]
}
```

---

## AUTHENTICATION (Optional for Write Operations)

For read-only operations above, **NO AUTHENTICATION REQUIRED**.

However, if you plan to add data or updates:

### Generate OAuth Token
**Endpoint:** `POST /o/token/`

**Required:**
- Client ID
- Client Secret
- Username
- Password

**Request:**
```bash
curl -X POST \
  -d "grant_type=password&username=user@email.com&password=pass&scope=read" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  https://api.kmhfr.health.go.ke/o/token/
```

**Response:**
```json
{
  "access_token": "abc123xyz789...",
  "token_type": "Bearer",
  "expires_in": 36000,
  "refresh_token": "refresh_abc123...",
  "scope": "read"
}
```

---

## IMPLEMENTATION EXAMPLES

### **TypeScript/Node.js Implementation**

#### 1. **Fetch All Facilities in a County**
```typescript
interface Facility {
  id: string;
  name: string;
  code: string;
  county_name: string;
  owner_name: string;
  number_of_beds: number;
  keph_level_name: string;
  lat_long: string;
}

async function getFacilitiesByCounty(
  countyName: string,
  pageSize: number = 50
): Promise<Facility[]> {
  const baseUrl = "https://api.kmhfr.health.go.ke/api";
  
  try {
    const response = await fetch(
      `${baseUrl}/facilities/facilities/?county_code=${countyName}&page_size=${pageSize}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching facilities:", error);
    throw error;
  }
}

// Usage
const facilities = await getFacilitiesByCounty("001"); // Nairobi
console.log(`Found ${facilities.length} facilities`);
```

#### 2. **Filter High-Priority Facilities (for equipment sales)**
```typescript
interface TargetFacility extends Facility {
  priority: "HIGH" | "MEDIUM" | "LOW";
  requiredEquipment: string[];
}

async function getTargetFacilities(): Promise<TargetFacility[]> {
  const kephLevels = ["Level 3", "Level 4"];
  const baseUrl = "https://api.kmhfr.health.go.ke/api";
  
  const response = await fetch(
    `${baseUrl}/facilities/facilities/?open_whole_day=true&is_regulated=true&page_size=100`
  );
  
  if (!response.ok) throw new Error("Failed to fetch");
  
  const data = await response.json();
  
  return data.results
    .filter((f: Facility) => {
      return kephLevels.includes(f.keph_level_name) && f.number_of_beds > 50;
    })
    .map((f: Facility) => ({
      ...f,
      priority:
        f.keph_level_name === "Level 4"
          ? "HIGH"
          : f.number_of_beds > 200
            ? "MEDIUM"
            : "LOW",
      requiredEquipment: getEquipmentByLevel(f.keph_level_name),
    }));
}

function getEquipmentByLevel(level: string): string[] {
  const equipmentMap: Record<string, string[]> = {
    "Level 2": ["Oxygen concentrator", "Basic lab equipment", "Blood pressure monitor"],
    "Level 3": [
      "Ventilator",
      "Dialysis machine",
      "Advanced lab equipment",
      "X-ray machine",
    ],
    "Level 4": [
      "CT Scanner",
      "MRI Machine",
      "Advanced ventilators",
      "Specialized surgical equipment",
    ],
  };
  
  return equipmentMap[level] || [];
}

// Usage
const targets = await getTargetFacilities();
console.log(`${targets.length} high-value targets identified`);
```

#### 3. **Get All Services Available at a Facility**
```typescript
async function getFacilityServices(facilityId: string): Promise<string[]> {
  const baseUrl = "https://api.kmhfr.health.go.ke/api";
  
  const response = await fetch(
    `${baseUrl}/facilities/material/?facility=${facilityId}`
  );
  
  if (!response.ok) throw new Error("Failed to fetch facility services");
  
  const data = await response.json();
  
  if (data.results.length === 0) return [];
  
  return data.results[0].service_names || [];
}

// Usage
const services = await getFacilityServices("497f6eca-6276-4993-bfeb-53cbbbba6f08");
console.log("Services offered:", services);
```

#### 4. **Map Facilities with Coordinates**
```typescript
interface FacilityWithCoords {
  id: string;
  name: string;
  lat: number;
  lng: number;
  county: string;
}

async function getFacilitiesForMapping(
  county?: string
): Promise<FacilityWithCoords[]> {
  const baseUrl = "https://api.kmhfr.health.go.ke/api";
  
  let url = `${baseUrl}/facilities/facilities/?page_size=1000`;
  if (county) {
    url += `&county=${county}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch");
  
  const data = await response.json();
  
  return data.results
    .filter((f: Facility) => f.lat_long)
    .map((f: Facility) => {
      const [lat, lng] = f.lat_long.split(",").map(Number);
      return {
        id: f.id,
        name: f.name,
        lat,
        lng,
        county: f.county_name,
      };
    });
}

// Usage - integrate with mapping library
const facilities = await getFacilitiesForMapping("Nairobi");
// facilities.forEach(f => {
//   map.addMarker({ lat: f.lat, lng: f.lng, title: f.name });
// });
```

#### 5. **Build Equipment Inventory Database**
```typescript
interface EquipmentInventory {
  facilityId: string;
  facilityName: string;
  equipment: {
    name: string;
    category: string;
    quantity?: number;
  }[];
}

async function buildEquipmentDatabase(): Promise<EquipmentInventory[]> {
  const baseUrl = "https://api.kmhfr.health.go.ke/api";
  
  // Get all infrastructure types
  const infraResponse = await fetch(
    `${baseUrl}/facilities/infrastructure/?page_size=500`
  );
  const infraData = await infraResponse.json();
  
  const categories: Record<string, string> = {};
  infraData.results.forEach((item: any) => {
    categories[item.id] = item.name;
  });
  
  // Get facility material view
  const materialResponse = await fetch(
    `${baseUrl}/facilities/material/?page_size=1000`
  );
  const materialData = await materialResponse.json();
  
  return materialData.results.map((facility: any) => ({
    facilityId: facility.code,
    facilityName: facility.name,
    equipment: facility.categories.map((catId: string) => ({
      name: categories[catId] || "Unknown",
      category: "Medical Equipment",
      quantity: facility[`${catId}_quantity`] || undefined,
    })),
  }));
}

// Usage
const inventory = await buildEquipmentDatabase();
console.log(`Equipment database: ${inventory.length} facilities`);
```

#### 6. **Get Contact Information for Cold Calling**
```typescript
interface FacilityContact {
  facilityId: string;
  facilityName: string;
  contacts: {
    type: string;
    value: string;
  }[];
  adminContact?: {
    officeName: string;
    email: string;
    phone: string;
  };
}

async function getFacilityContactsForSales(
  facilityId: string
): Promise<FacilityContact> {
  const baseUrl = "https://api.kmhfr.health.go.ke/api";
  
  // Get facility info
  const facResponse = await fetch(
    `${baseUrl}/facilities/facilities/${facilityId}/`
  );
  const facility = await facResponse.json();
  
  // Get facility contacts
  const contactResponse = await fetch(
    `${baseUrl}/facilities/contacts/?facility=${facilityId}`
  );
  const contactData = await contactResponse.json();
  
  // Get admin office contacts
  const adminResponse = await fetch(`${baseUrl}/admin_offices/?county=${facility.county}`);
  const adminData = await adminResponse.json();
  const adminOffice = adminData.results[0];
  
  return {
    facilityId,
    facilityName: facility.name,
    contacts: contactData.results.map((c: any) => ({
      type: c.contact_type,
      value: c.actual_contact,
    })),
    adminContact: adminOffice
      ? {
          officeName: adminOffice.name,
          email: adminOffice.email,
          phone: adminOffice.phone_number,
        }
      : undefined,
  };
}

// Usage
const contact = await getFacilityContactsForSales("497f6eca-6276-4993-bfeb-53cbbbba6f08");
console.log("Sales contact info:", contact);
```

#### 7. **Python Backend Integration**
```python
import requests
import json
from typing import List, Dict, Any

BASE_URL = "https://api.kmhfr.health.go.ke/api"

def get_all_facilities(county: str = None, keph_level: str = None) -> List[Dict]:
    """Fetch all facilities with optional filtering"""
    url = f"{BASE_URL}/facilities/facilities/"
    
    params = {
        "page_size": 100,
    }
    
    if county:
        params["county_code"] = county
    if keph_level:
        params["keph_level"] = keph_level
    
    all_results = []
    next_url = url
    
    while next_url:
        response = requests.get(next_url, params=params if next_url == url else {})
        response.raise_for_status()
        
        data = response.json()
        all_results.extend(data["results"])
        
        next_url = data.get("next")
    
    return all_results

def get_infrastructure_by_facility(facility_id: str) -> Dict[str, Any]:
    """Get equipment inventory for a specific facility"""
    url = f"{BASE_URL}/facilities/material/"
    
    response = requests.get(url, params={"facility": facility_id})
    response.raise_for_status()
    
    data = response.json()
    return data["results"][0] if data["results"] else {}

def export_facilities_to_csv(filename: str = "facilities.csv"):
    """Export all facility data to CSV"""
    import csv
    
    facilities = get_all_facilities()
    
    with open(filename, 'w', newline='') as csvfile:
        fieldnames = [
            'facility_id', 'name', 'code', 'county', 'keph_level',
            'owner', 'beds', 'operational', 'lat_long'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for facility in facilities:
            writer.writerow({
                'facility_id': facility.get('id'),
                'name': facility.get('name'),
                'code': facility.get('code'),
                'county': facility.get('county_name'),
                'keph_level': facility.get('keph_level_name'),
                'owner': facility.get('owner_name'),
                'beds': facility.get('number_of_beds'),
                'operational': facility.get('operation_status_name'),
                'lat_long': facility.get('lat_long'),
            })
    
    print(f"Exported {len(facilities)} facilities to {filename}")

# Usage
facilities = get_all_facilities(county="Nairobi")
print(f"Found {len(facilities)} facilities in Nairobi")

equipment = get_infrastructure_by_facility("497f6eca-6276-4993-bfeb-53cbbbba6f08")
print(f"Equipment inventory: {equipment}")

export_facilities_to_csv()
```

#### 8. **React Frontend Example**
```typescript
import { useState, useEffect } from 'react';

interface Facility {
  id: string;
  name: string;
  code: string;
  county_name: string;
  keph_level_name: string;
  number_of_beds: number;
}

function FacilityList() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [county, setCounty] = useState('');

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const url = new URL('https://api.kmhfr.health.go.ke/api/facilities/facilities/');
        
        if (county) url.searchParams.append('county_code', county);
        url.searchParams.append('page_size', '50');

        const response = await fetch(url.toString());
        const data = await response.json();
        setFacilities(data.results);
      } catch (error) {
        console.error('Error fetching facilities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [county]);

  if (loading) return <div>Loading facilities...</div>;

  return (
    <div>
      <input
        type="text"
        placeholder="Filter by county..."
        value={county}
        onChange={(e) => setCounty(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>Facility Name</th>
            <th>Code</th>
            <th>County</th>
            <th>KEPH Level</th>
            <th>Beds</th>
          </tr>
        </thead>
        <tbody>
          {facilities.map((facility) => (
            <tr key={facility.id}>
              <td>{facility.name}</td>
              <td>{facility.code}</td>
              <td>{facility.county_name}</td>
              <td>{facility.keph_level_name}</td>
              <td>{facility.number_of_beds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FacilityList;
```

---

## ERROR HANDLING

### Common Errors & Solutions

```typescript
async function robustFetch(url: string): Promise<any> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EquipmentSupplier/1.0'
        },
        timeout: 30000
      });

      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After') || '60';
        console.warn(`Rate limited. Waiting ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
        attempt++;
        continue;
      }

      if (response.status === 404) {
        throw new Error('Resource not found');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      attempt++;
      if (attempt === maxRetries) {
        console.error(`Failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### Rate Limiting
- API may have rate limits
- Implement exponential backoff
- Cache results when possible
- Use pagination efficiently (page_size parameter)

### Data Validation
```typescript
function validateFacility(facility: any): facility is Facility {
  return (
    facility.id &&
    facility.name &&
    facility.code &&
    facility.county_name
  );
}
```

---

## QUICK START CHECKLIST

- [ ] Test basic facility query on your device
- [ ] Get facility list for your target region(s)
- [ ] Implement equipment/infrastructure filtering
- [ ] Build facility contact scraper
- [ ] Create facility targeting algorithm (by KEPH level, beds, services)
- [ ] Set up periodic data refresh
- [ ] Add geographic/map features
- [ ] Build sales dashboard with facility data
- [ ] Test error handling and retries
- [ ] Deploy to production

---

## Additional Resources

- **Full API Documentation:** https://api.kmhfr.health.go.ke/api/explore/
- **Swagger UI:** https://api.kmhfr.health.go.ke/api/docs/
- **GitHub:** https://github.com/uonafya/kmhfr-docs
