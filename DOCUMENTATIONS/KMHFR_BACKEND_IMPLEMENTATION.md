# KMHFR Backend Implementation Patterns

Complete backend implementation examples for medical equipment suppliers using KMHFR API.

---

## TABLE OF CONTENTS

1. [Node.js/Express Backend](#nodejs-express-backend)
2. [Python/FastAPI Backend](#pythonfastapi-backend)
3. [Database Sync Strategy](#database-sync-strategy)
4. [Caching Implementation](#caching-implementation)
5. [Error Handling & Retry Logic](#error-handling--retry-logic)
6. [Data Models](#data-models)

---

## NODE.JS/EXPRESS BACKEND

### Setup
```bash
npm install express axios dotenv cors helmet
```

### `src/config/api.ts`
```typescript
const API_CONFIG = {
  baseURL: "https://api.kmhfr.health.go.ke/api",
  timeout: 30000,
  headers: {
    "Accept": "application/json",
    "User-Agent": "MedicalEquipmentSupplier/1.0",
  },
};

export default API_CONFIG;
```

### `src/services/kmhfr.service.ts`
```typescript
import axios, { AxiosInstance } from "axios";
import API_CONFIG from "../config/api";

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface Facility {
  id: string;
  name: string;
  code: string;
  county_name: string;
  keph_level_name: string;
  number_of_beds: number;
  owner_name: string;
  operation_status_name: string;
  lat_long: string;
  facility_type: string;
  facility_type_name: string;
}

class KMHFRService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create(API_CONFIG);
  }

  /**
   * Fetch all facilities with optional filtering
   */
  async getFacilities(filters: {
    county?: string;
    facilityType?: string;
    kephlevel?: string;
    pageSize?: number;
    page?: number;
  } = {}): Promise<ApiResponse<Facility>> {
    const params: any = {
      page_size: filters.pageSize || 50,
    };

    if (filters.page) params.page = filters.page;
    if (filters.county) params.county_code = filters.county;
    if (filters.facilityType) params.facility_type = filters.facilityType;
    if (filters.kephlevel) {
      params.keph_level = {
        "Level 2": "level_2",
        "Level 3": "level_3",
        "Level 4": "level_4",
      }[filters.kephlevel];
    }

    try {
      const response = await this.client.get<ApiResponse<Facility>>(
        "/facilities/facilities/",
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all facilities (paginated iterator)
   */
  async *getAllFacilitiesIterator(): AsyncGenerator<Facility[]> {
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.getFacilities({
        pageSize: 100,
        page,
      });

      if (response.results.length === 0) {
        hasNextPage = false;
      } else {
        yield response.results;
        hasNextPage = response.next !== null;
        page++;
      }
    }
  }

  /**
   * Get facility by ID with full details
   */
  async getFacilityById(facilityId: string): Promise<Facility> {
    try {
      const response = await this.client.get<Facility>(
        `/facilities/facilities/${facilityId}/`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search facilities
   */
  async searchFacilities(query: string): Promise<Facility[]> {
    try {
      const response = await this.client.get<ApiResponse<Facility>>(
        "/facilities/facilities/",
        {
          params: {
            search: query,
            page_size: 100,
          },
        }
      );
      return response.data.results;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all infrastructure/equipment types
   */
  async getInfrastructure(pageSize: number = 500): Promise<any[]> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        "/facilities/infrastructure/",
        {
          params: { page_size: pageSize },
        }
      );

      let allResults = response.data.results;
      let nextUrl = response.data.next;

      // Fetch remaining pages if any
      while (nextUrl) {
        const nextResponse = await axios.get<ApiResponse<any>>(nextUrl);
        allResults = [...allResults, ...nextResponse.data.results];
        nextUrl = nextResponse.data.next;
      }

      return allResults;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get services by category
   */
  async getServices(categoryId?: string): Promise<any[]> {
    try {
      const params: any = { page_size: 500 };
      if (categoryId) params.category = categoryId;

      const response = await this.client.get<ApiResponse<any>>(
        "/facilities/services/",
        { params }
      );
      return response.data.results;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get facility contacts
   */
  async getFacilityContacts(facilityId: string): Promise<any[]> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        "/facilities/contacts/",
        {
          params: {
            facility: facilityId,
            page_size: 100,
          },
        }
      );
      return response.data.results;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get facility equipment/material view
   */
  async getFacilityEquipment(facilityId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        "/facilities/material/",
        {
          params: {
            facility: facilityId,
          },
        }
      );
      return response.data.results[0] || null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get geographic data (counties, constituencies, wards)
   */
  async getCounties(): Promise<any[]> {
    return this.getPaginatedData("/common/counties/");
  }

  async getConstituencies(countyId?: string): Promise<any[]> {
    const params = countyId ? { county: countyId } : {};
    return this.getPaginatedData("/common/constituencies/", params);
  }

  async getWards(constituencyId?: string): Promise<any[]> {
    const params = constituencyId
      ? { constituency: constituencyId }
      : {};
    return this.getPaginatedData("/common/wards/", params);
  }

  /**
   * Get all results from paginated endpoint
   */
  private async getPaginatedData(
    endpoint: string,
    params: any = {}
  ): Promise<any[]> {
    let allResults: any[] = [];
    let nextUrl = `${API_CONFIG.baseURL}${endpoint}`;
    params.page_size = 500;

    try {
      while (nextUrl) {
        const response = await axios.get<ApiResponse<any>>(nextUrl, {
          params: nextUrl === `${API_CONFIG.baseURL}${endpoint}` ? params : {},
          headers: API_CONFIG.headers,
        });

        allResults = [...allResults, ...response.data.results];
        nextUrl = response.data.next;
      }

      return allResults;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get KEPH levels
   */
  async getKEPHLevels(): Promise<any[]> {
    return this.getPaginatedData("/facilities/keph/");
  }

  /**
   * Get facility types
   */
  async getFacilityTypes(): Promise<any[]> {
    return this.getPaginatedData("/facilities/facility_types/");
  }

  /**
   * Get owner types
   */
  async getOwnerTypes(): Promise<any[]> {
    return this.getPaginatedData("/facilities/owner_types/");
  }

  /**
   * Error handler
   */
  private handleError(error: any): Error {
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data,
      });
      return new Error(
        `API Error ${error.response.status}: ${error.response.statusText}`
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
      return new Error("No response from API server");
    } else {
      console.error("Request error:", error.message);
      return error;
    }
  }
}

export default new KMHFRService();
```

### `src/routes/facilities.route.ts`
```typescript
import express, { Router, Request, Response } from "express";
import kmhfrService from "../services/kmhfr.service";

const router: Router = express.Router();

/**
 * GET /api/facilities
 * Get paginated facility list
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { county, facilityType, kephlevel, page = 1, pageSize = 50 } = req.query;

    const data = await kmhfrService.getFacilities({
      county: county as string,
      facilityType: facilityType as string,
      kephlevel: kephlevel as string,
      page: parseInt(page as string),
      pageSize: Math.min(parseInt(pageSize as string), 500),
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/facilities/:id
 * Get facility details
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const facility = await kmhfrService.getFacilityById(req.params.id);
    res.json(facility);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/facilities/search
 * Search facilities
 */
router.get("/search/:query", async (req: Request, res: Response) => {
  try {
    const results = await kmhfrService.searchFacilities(req.params.query);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/facilities/:id/contacts
 * Get facility contacts
 */
router.get("/:id/contacts", async (req: Request, res: Response) => {
  try {
    const contacts = await kmhfrService.getFacilityContacts(req.params.id);
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/facilities/:id/equipment
 * Get facility equipment inventory
 */
router.get("/:id/equipment", async (req: Request, res: Response) => {
  try {
    const equipment = await kmhfrService.getFacilityEquipment(req.params.id);
    res.json(equipment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### `src/routes/metadata.route.ts`
```typescript
import express, { Router, Request, Response } from "express";
import kmhfrService from "../services/kmhfr.service";

const router: Router = express.Router();

router.get("/keph-levels", async (req: Request, res: Response) => {
  try {
    const data = await kmhfrService.getKEPHLevels();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/facility-types", async (req: Request, res: Response) => {
  try {
    const data = await kmhfrService.getFacilityTypes();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/owner-types", async (req: Request, res: Response) => {
  try {
    const data = await kmhfrService.getOwnerTypes();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/services", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const data = await kmhfrService.getServices(category as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/infrastructure", async (req: Request, res: Response) => {
  try {
    const data = await kmhfrService.getInfrastructure();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/geographic/counties", async (req: Request, res: Response) => {
  try {
    const data = await kmhfrService.getCounties();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/geographic/constituencies", async (req: Request, res: Response) => {
  try {
    const { county } = req.query;
    const data = await kmhfrService.getConstituencies(county as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/geographic/wards", async (req: Request, res: Response) => {
  try {
    const { constituency } = req.query;
    const data = await kmhfrService.getWards(constituency as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### `src/app.ts`
```typescript
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import facilitiesRoute from "./routes/facilities.route";
import metadataRoute from "./routes/metadata.route";

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/facilities", facilitiesRoute);
app.use("/api/metadata", metadataRoute);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
```

---

## PYTHON/FASTAPI BACKEND

### Setup
```bash
pip install fastapi uvicorn httpx sqlalchemy alembic pydantic
```

### `app/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_URL: str = "https://api.kmhfr.health.go.ke/api"
    API_TIMEOUT: int = 30
    CACHE_TTL: int = 3600  # 1 hour
    DATABASE_URL: str = "sqlite:///./kmhfr.db"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### `app/services/kmhfr_service.py`
```python
import httpx
import asyncio
from typing import List, Optional, Dict, Any, AsyncGenerator
from app.config import settings

class KMHFRService:
    def __init__(self):
        self.base_url = settings.API_URL
        self.timeout = settings.API_TIMEOUT
        
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "MedicalEquipmentSupplier/1.0",
        }
    
    async def _get(
        self, 
        endpoint: str, 
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make GET request with error handling"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}{endpoint}"
            response = await client.get(url, params=params, headers=self.headers)
            response.raise_for_status()
            return response.json()
    
    async def get_facilities(
        self,
        county: Optional[str] = None,
        facility_type: Optional[str] = None,
        keph_level: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """Get facilities with optional filtering"""
        params = {
            "page": page,
            "page_size": min(page_size, 500),
        }
        
        if county:
            params["county_code"] = county
        if facility_type:
            params["facility_type"] = facility_type
        if keph_level:
            params["keph_level"] = keph_level
        
        return await self._get("/facilities/facilities/", params)
    
    async def get_all_facilities(
        self,
        county: Optional[str] = None,
    ) -> AsyncGenerator[List[Dict], None]:
        """Fetch all facilities page by page"""
        page = 1
        while True:
            data = await self.get_facilities(
                county=county,
                page=page,
                page_size=100,
            )
            
            if not data.get("results"):
                break
            
            yield data["results"]
            
            if not data.get("next"):
                break
            
            page += 1
    
    async def get_facility_by_id(self, facility_id: str) -> Dict[str, Any]:
        """Get specific facility details"""
        return await self._get(f"/facilities/facilities/{facility_id}/")
    
    async def search_facilities(self, query: str) -> Dict[str, Any]:
        """Search facilities"""
        params = {
            "search": query,
            "page_size": 100,
        }
        return await self._get("/facilities/facilities/", params)
    
    async def get_facility_contacts(self, facility_id: str) -> List[Dict]:
        """Get facility contacts"""
        data = await self._get(
            "/facilities/contacts/",
            {"facility": facility_id, "page_size": 100},
        )
        return data.get("results", [])
    
    async def get_facility_equipment(self, facility_id: str) -> Optional[Dict]:
        """Get facility equipment inventory"""
        data = await self._get(
            "/facilities/material/",
            {"facility": facility_id},
        )
        results = data.get("results", [])
        return results[0] if results else None
    
    async def get_infrastructure(self, page_size: int = 500) -> List[Dict]:
        """Get all infrastructure/equipment types"""
        return await self._get_all_pages(
            "/facilities/infrastructure/",
            page_size=page_size,
        )
    
    async def get_services(
        self,
        category: Optional[str] = None,
        page_size: int = 500,
    ) -> List[Dict]:
        """Get services"""
        params = {"page_size": page_size}
        if category:
            params["category"] = category
        
        return await self._get_all_pages("/facilities/services/", **params)
    
    async def get_keph_levels(self) -> List[Dict]:
        """Get KEPH levels"""
        return await self._get_all_pages("/facilities/keph/")
    
    async def get_facility_types(self) -> List[Dict]:
        """Get facility types"""
        return await self._get_all_pages("/facilities/facility_types/")
    
    async def get_owner_types(self) -> List[Dict]:
        """Get owner types"""
        return await self._get_all_pages("/facilities/owner_types/")
    
    async def get_counties(self) -> List[Dict]:
        """Get all counties"""
        return await self._get_all_pages("/common/counties/")
    
    async def get_constituencies(
        self,
        county: Optional[str] = None,
    ) -> List[Dict]:
        """Get constituencies"""
        params = {}
        if county:
            params["county"] = county
        
        return await self._get_all_pages("/common/constituencies/", **params)
    
    async def get_wards(
        self,
        constituency: Optional[str] = None,
    ) -> List[Dict]:
        """Get wards"""
        params = {}
        if constituency:
            params["constituency"] = constituency
        
        return await self._get_all_pages("/common/wards/", **params)
    
    async def _get_all_pages(
        self,
        endpoint: str,
        page_size: int = 500,
        **params,
    ) -> List[Dict]:
        """Get all results from paginated endpoint"""
        all_results = []
        params["page_size"] = page_size
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            next_url = f"{self.base_url}{endpoint}"
            
            while next_url:
                response = await client.get(
                    next_url,
                    params=params if next_url == f"{self.base_url}{endpoint}" else {},
                    headers=self.headers,
                )
                response.raise_for_status()
                
                data = response.json()
                all_results.extend(data.get("results", []))
                
                next_url = data.get("next")
                params = {}  # Clear params for subsequent requests
        
        return all_results

# Singleton instance
kmhfr_service = KMHFRService()
```

### `app/models.py`
```python
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Facility(Base):
    __tablename__ = "facilities"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kmhfr_id = Column(String(36), unique=True, index=True)
    name = Column(String(255), index=True)
    code = Column(String(50), unique=True, index=True)
    county = Column(String(100), index=True)
    constituency = Column(String(100))
    ward = Column(String(100))
    keph_level = Column(String(50))
    facility_type = Column(String(100))
    owner = Column(String(100))
    beds = Column(Integer)
    cots = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    is_operational = Column(Boolean, default=True)
    last_synced = Column(DateTime, default=datetime.utcnow)
    
    contacts = relationship("FacilityContact", back_populates="facility")
    equipment = relationship("FacilityEquipment", back_populates="facility")

class FacilityContact(Base):
    __tablename__ = "facility_contacts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    facility_id = Column(String(36), ForeignKey("facilities.id"))
    contact_type = Column(String(50))  # Email, Phone, etc.
    contact_value = Column(String(255))
    
    facility = relationship("Facility", back_populates="contacts")

class FacilityEquipment(Base):
    __tablename__ = "facility_equipment"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    facility_id = Column(String(36), ForeignKey("facilities.id"))
    equipment_name = Column(String(255))
    category = Column(String(100))
    quantity = Column(Integer)
    
    facility = relationship("Facility", back_populates="equipment")
```

### `app/routes/facilities.py`
```python
from fastapi import APIRouter, Query, HTTPException
from app.services.kmhfr_service import kmhfr_service
from typing import Optional, List

router = APIRouter(prefix="/api/facilities", tags=["facilities"])

@router.get("/")
async def list_facilities(
    county: Optional[str] = Query(None),
    facility_type: Optional[str] = Query(None),
    keph_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    """Get paginated facility list"""
    try:
        data = await kmhfr_service.get_facilities(
            county=county,
            facility_type=facility_type,
            keph_level=keph_level,
            page=page,
            page_size=page_size,
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{facility_id}")
async def get_facility(facility_id: str):
    """Get facility details"""
    try:
        facility = await kmhfr_service.get_facility_by_id(facility_id)
        return facility
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/{query}")
async def search_facilities(query: str):
    """Search facilities"""
    try:
        results = await kmhfr_service.search_facilities(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{facility_id}/contacts")
async def get_facility_contacts(facility_id: str):
    """Get facility contacts"""
    try:
        contacts = await kmhfr_service.get_facility_contacts(facility_id)
        return {"results": contacts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{facility_id}/equipment")
async def get_facility_equipment(facility_id: str):
    """Get facility equipment"""
    try:
        equipment = await kmhfr_service.get_facility_equipment(facility_id)
        return equipment or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### `app/routes/metadata.py`
```python
from fastapi import APIRouter, HTTPException, Query
from app.services.kmhfr_service import kmhfr_service
from typing import Optional

router = APIRouter(prefix="/api/metadata", tags=["metadata"])

@router.get("/keph-levels")
async def get_keph_levels():
    """Get KEPH levels"""
    try:
        return await kmhfr_service.get_keph_levels()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/facility-types")
async def get_facility_types():
    """Get facility types"""
    try:
        return await kmhfr_service.get_facility_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/owner-types")
async def get_owner_types():
    """Get owner types"""
    try:
        return await kmhfr_service.get_owner_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/services")
async def get_services(category: Optional[str] = Query(None)):
    """Get services"""
    try:
        return await kmhfr_service.get_services(category=category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/infrastructure")
async def get_infrastructure():
    """Get infrastructure/equipment types"""
    try:
        return await kmhfr_service.get_infrastructure()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/geographic/counties")
async def get_counties():
    """Get counties"""
    try:
        return await kmhfr_service.get_counties()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/geographic/constituencies")
async def get_constituencies(county: Optional[str] = Query(None)):
    """Get constituencies"""
    try:
        return await kmhfr_service.get_constituencies(county=county)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/geographic/wards")
async def get_wards(constituency: Optional[str] = Query(None)):
    """Get wards"""
    try:
        return await kmhfr_service.get_wards(constituency=constituency)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware import cors
from app.routes import facilities, metadata
from app.config import settings

app = FastAPI(
    title="Medical Equipment Supplier - KMHFR API",
    version="1.0.0",
)

# Middleware
app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(facilities.router)
app.include_router(metadata.router)

@app.get("/health")
async def health_check():
    return {"status": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## DATABASE SYNC STRATEGY

### `app/tasks/sync_facilities.py` (Python)
```python
import asyncio
from sqlalchemy.orm import Session
from app.services.kmhfr_service import kmhfr_service
from app.models import Facility, FacilityContact
from app.database import SessionLocal
from datetime import datetime

async def sync_all_facilities():
    """Sync all facilities from KMHFR API to local database"""
    db: Session = SessionLocal()
    
    try:
        print("Starting facility sync...")
        batch_size = 100
        batch = []
        
        async for facilities_chunk in kmhfr_service.get_all_facilities():
            for facility_data in facilities_chunk:
                # Parse coordinates
                lat, lng = None, None
                if facility_data.get("lat_long"):
                    try:
                        lat, lng = map(float, facility_data["lat_long"].split(","))
                    except:
                        pass
                
                facility = Facility(
                    kmhfr_id=facility_data["id"],
                    name=facility_data["name"],
                    code=facility_data["code"],
                    county=facility_data.get("county_name"),
                    constituency=facility_data.get("constituency_name"),
                    ward=facility_data.get("ward_name"),
                    keph_level=facility_data.get("keph_level_name"),
                    facility_type=facility_data.get("facility_type_name"),
                    owner=facility_data.get("owner_name"),
                    beds=facility_data.get("number_of_beds"),
                    cots=facility_data.get("number_of_cots"),
                    latitude=lat,
                    longitude=lng,
                    is_operational=(
                        facility_data.get("operation_status_name") == "Operational"
                    ),
                    last_synced=datetime.utcnow(),
                )
                
                batch.append(facility)
                
                if len(batch) >= batch_size:
                    db.add_all(batch)
                    db.commit()
                    print(f"Synced {len(batch)} facilities")
                    batch = []
        
        # Sync remaining
        if batch:
            db.add_all(batch)
            db.commit()
            print(f"Synced {len(batch)} facilities")
        
        print("Facility sync completed")
    
    except Exception as e:
        print(f"Error syncing facilities: {e}")
        db.rollback()
    
    finally:
        db.close()

# Run with: asyncio.run(sync_all_facilities())
```

---

## CACHING IMPLEMENTATION

### `app/cache.py`
```python
import json
from datetime import datetime, timedelta
from typing import Optional, Any
import redis

class CacheManager:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url)
        self.ttl = 3600  # 1 hour default
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        cached = self.redis_client.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> None:
        """Set cache value"""
        ttl = ttl or self.ttl
        self.redis_client.setex(
            key,
            ttl,
            json.dumps(value),
        )
    
    def cache_key(self, endpoint: str, **kwargs) -> str:
        """Generate cache key from endpoint and params"""
        params_str = "_".join(f"{k}:{v}" for k, v in sorted(kwargs.items()))
        return f"kmhfr:{endpoint}:{params_str}" if params_str else f"kmhfr:{endpoint}"

# Usage
cache = CacheManager()

# In service
async def get_cached_facilities(county: str = None):
    cache_key = cache.cache_key("/facilities", county=county)
    
    # Try cache first
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Fetch from API
    data = await kmhfr_service.get_facilities(county=county)
    
    # Cache and return
    cache.set(cache_key, data)
    return data
```

---

## ERROR HANDLING & RETRY LOGIC

### `app/utils/retry.py`
```python
import asyncio
import logging
from typing import Callable, Any
from functools import wraps

logger = logging.getLogger(__name__)

def retry_on_failure(
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    initial_delay: float = 1.0,
):
    """Decorator for async functions with exponential backoff"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            delay = initial_delay
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Attempt {attempt + 1} failed: {e}. "
                            f"Retrying in {delay}s..."
                        )
                        await asyncio.sleep(delay)
                        delay *= backoff_factor
                    else:
                        logger.error(
                            f"All {max_retries} attempts failed: {e}"
                        )
            
            raise last_exception
        
        return wrapper
    return decorator

# Usage
@retry_on_failure(max_retries=3)
async def fetch_facilities():
    return await kmhfr_service.get_facilities()
```

---

## DATA MODELS

### TypeScript Types
```typescript
// Facility
interface Facility {
  id: string;
  name: string;
  code: string;
  official_name?: string;
  county: string;
  county_name: string;
  constituency: string;
  constituency_name: string;
  ward: string;
  ward_name: string;
  keph_level: string;
  keph_level_name: string;
  facility_type: string;
  facility_type_name: string;
  owner: string;
  owner_name: string;
  owner_type_name: string;
  operation_status_name: string;
  number_of_beds: number;
  number_of_cots: number;
  number_of_inpatient_beds: number;
  lat_long: string; // "lat,lng"
  average_rating: string;
  open_whole_day: boolean;
  open_weekends: boolean;
  open_public_holidays: boolean;
  description?: string;
}

// Service
interface Service {
  id: string;
  name: string;
  category: string;
  category_name: string;
  keph_level: string;
  keph_level_name: string;
  description?: string;
  has_options: boolean;
}

// Equipment/Infrastructure
interface Equipment {
  id: string;
  name: string;
  category: string;
  category_name: string;
  description?: string;
  abbreviation?: string;
  numbers: boolean; // Quantity tracked
}

// Contact
interface Contact {
  id: string;
  facility: string;
  contact_type: string; // "Email", "Phone"
  actual_contact: string;
  contact_name?: string;
}
```

---

## NEXT STEPS

1. Choose Node.js or Python backend based on your needs
2. Implement caching for better performance
3. Set up database sync tasks (run daily/hourly)
4. Add data analytics/reporting
5. Build customer/prospect database
6. Integrate with CRM system
7. Add notification system for procurement opportunities
