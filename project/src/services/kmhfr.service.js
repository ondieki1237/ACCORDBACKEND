import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * KMHFR Service - Robust implementation with caching, retries, and error handling
 * Base URL: https://api.kmhfr.health.go.ke/api/
 * 
 * NOTE: Includes mock data fallback when external API is unavailable
 */

const KMHFR_BASE = 'https://api.kmhfr.health.go.ke/api';
const API_TIMEOUT = 10000; // 10 seconds
const CACHE_TTL = 3600; // 1 hour for metadata, 5 mins for facilities
const MAX_RETRIES = 3;
const USE_MOCK_DATA = true; // Enable mock data fallback

// Initialize cache
const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120 });

/**
 * Mock data fallback when external API is unavailable
 */
const mockData = {
  counties: [
    { id: '001', name: 'Nairobi', code: '001' },
    { id: '002', name: 'Mombasa', code: '002' },
    { id: '003', name: 'Kisumu', code: '003' },
    { id: '004', name: 'Nakuru', code: '004' },
    { id: '005', name: 'Eldoret', code: '005' }
  ],
  facilityTypes: [
    { id: '1', name: 'Hospital' },
    { id: '2', name: 'Health Center' },
    { id: '3', name: 'Clinic' },
    { id: '4', name: 'Dispensary' },
    { id: '5', name: 'Diagnostic Center' }
  ],
  kephLevels: [
    { id: '1', name: 'Level 1' },
    { id: '2', name: 'Level 2' },
    { id: '3', name: 'Level 3' },
    { id: '4', name: 'Level 4' },
    { id: '5', name: 'Level 5' }
  ],
  ownerTypes: [
    { id: '1', name: 'Public' },
    { id: '2', name: 'Private' },
    { id: '3', name: 'NGO' },
    { id: '4', name: 'FBO' }
  ],
  services: [
    { id: '1', name: 'Outpatient Services' },
    { id: '2', name: 'Inpatient Services' },
    { id: '3', name: 'Laboratory Services' },
    { id: '4', name: 'Imaging Services' },
    { id: '5', name: 'Emergency Services' }
  ],
  infrastructure: [
    { id: '1', name: 'Oxygen Concentrator' },
    { id: '2', name: 'Ventilator' },
    { id: '3', name: 'X-Ray Machine' },
    { id: '4', name: 'Ultrasound Machine' },
    { id: '5', name: 'ECG Machine' }
  ]
};

// Axios instance with default config
const axiosInstance = axios.create({
  baseURL: KMHFR_BASE,
  timeout: API_TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'ACCORD-Medical-Backend/1.0'
  }
});

/**
 * Retry logic with exponential backoff
 */
async function retryRequest(fn, maxRetries = MAX_RETRIES) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable = error.response?.status >= 500 || error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND';
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Get mock data for an endpoint
 */
function getMockDataForEndpoint(endpoint) {
  const endpointMap = {
    '/common/counties/': mockData.counties,
    '/common/constituencies/': mockData.counties.slice(0, 1), // Simplified for demo
    '/common/facility-types/': mockData.facilityTypes,
    '/common/keph-levels/': mockData.kephLevels,
    '/common/owner-types/': mockData.ownerTypes,
    '/common/services/': mockData.services,
    '/common/infrastructure/': mockData.infrastructure,
    '/facilities/facilities/': [
      { id: 'f1', name: 'Kenyatta National Hospital', county_name: 'Nairobi', facility_type_name: 'Hospital', keph_level_name: 'Level 4', owner_type_name: 'Public' },
      { id: 'f2', name: 'Nairobi Hospital', county_name: 'Nairobi', facility_type_name: 'Hospital', keph_level_name: 'Level 4', owner_type_name: 'Private' },
      { id: 'f3', name: 'City General Health Center', county_name: 'Nairobi', facility_type_name: 'Health Center', keph_level_name: 'Level 2', owner_type_name: 'Public' }
    ],
    '/facilities/services/': mockData.services,
    '/facilities/infrastructure/': mockData.infrastructure
  };

  return endpointMap[endpoint] || [];
}

/**
 * Get paginated data from any endpoint
 */
async function getPaginatedData(endpoint, params = {}, fromCache = true) {
  const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
  
  if (fromCache) {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  const allResults = [];
  let nextUrl = `${KMHFR_BASE}${endpoint}`;
  let totalPages = 0;

  while (nextUrl && totalPages < 200) { // Prevent infinite loops, max 200 pages
    try {
      const response = await retryRequest(() =>
        axiosInstance.get(nextUrl, {
          params: totalPages === 0 ? params : {}, // Only pass params on first request
          timeout: API_TIMEOUT
        })
      );

      const data = response.data;
      if (data.results && Array.isArray(data.results)) {
        allResults.push(...data.results);
      }

      nextUrl = data.next || null;
      totalPages++;
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error.message);
      
      // Fallback to mock data if enabled and no results yet
      if (USE_MOCK_DATA && allResults.length === 0) {
        console.warn(`[KMHFR] Using mock data for ${endpoint} (API unavailable)`);
        const mockResults = getMockDataForEndpoint(endpoint);
        if (fromCache && mockResults.length > 0) {
          cache.set(cacheKey, mockResults);
        }
        return mockResults;
      }
      
      if (allResults.length === 0) throw error; // Throw if no data collected
      break; // Return partial results if we have some
    }
  }

  if (fromCache && allResults.length > 0) {
    cache.set(cacheKey, allResults);
  }

  return allResults;
}

/**
 * Get single page of data
 */
async function getPagedData(endpoint, params = {}) {
  try {
    const response = await retryRequest(() =>
      axiosInstance.get(endpoint, { params, timeout: API_TIMEOUT })
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    
    // Fallback to mock data if enabled
    if (USE_MOCK_DATA) {
      console.warn(`[KMHFR] Using mock data for ${endpoint} (API unavailable)`);
      const mockResults = getMockDataForEndpoint(endpoint);
      return { 
        results: mockResults,
        count: mockResults.length,
        next: null,
        previous: null
      };
    }
    
    throw new Error(`Failed to fetch from ${endpoint}: ${error.message}`);
  }
}

/**
 * FACILITIES ENDPOINTS
 */

export const facilitiesService = {
  /**
   * Get all facilities with optional filtering
   */
  async getFacilities(filters = {}) {
    try {
      const params = {
        page_size: filters.page_size || 50,
        page: filters.page || 1,
      };

      if (filters.name) params.name = filters.name;
      if (filters.code) params.code = filters.code;
      if (filters.facility_type) params.facility_type = filters.facility_type;
      if (filters.county) params.county = filters.county;
      if (filters.county_code) params.county_code = filters.county_code;
      if (filters.constituency) params.constituency = filters.constituency;
      if (filters.ward) params.ward = filters.ward;
      if (filters.owner) params.owner = filters.owner;
      if (filters.operation_status) params.operation_status = filters.operation_status;
      if (filters.is_regulated !== undefined) params.is_regulated = filters.is_regulated;
      if (filters.is_published !== undefined) params.is_published = filters.is_published;
      if (filters.open_whole_day !== undefined) params.open_whole_day = filters.open_whole_day;
      if (filters.ordering) params.ordering = filters.ordering;

      return await getPagedData('/facilities/facilities/', params);
    } catch (error) {
      throw new Error(`Failed to get facilities: ${error.message}`);
    }
  },

  /**
   * Get all facilities (paginated generator)
   */
  async getAllFacilities(filters = {}, pageSize = 100) {
    try {
      const params = { ...filters, page_size: pageSize };
      return await getPaginatedData('/facilities/facilities/', params, false);
    } catch (error) {
      throw new Error(`Failed to get all facilities: ${error.message}`);
    }
  },

  /**
   * Get facility by ID
   */
  async getFacilityById(facilityId) {
    try {
      const response = await retryRequest(() =>
        axiosInstance.get(`/facilities/facilities/${facilityId}/`, { timeout: API_TIMEOUT })
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching facility ${facilityId}:`, error.message);
      throw new Error(`Facility not found: ${facilityId}`);
    }
  },

  /**
   * Search facilities
   */
  async searchFacilities(query, pageSize = 50) {
    try {
      return await getPaginatedData('/facilities/facilities/', {
        search: query,
        page_size: pageSize
      }, false);
    } catch (error) {
      throw new Error(`Failed to search facilities: ${error.message}`);
    }
  },

  /**
   * Get facility contacts
   */
  async getFacilityContacts(facilityId) {
    try {
      return await getPaginatedData('/facilities/contacts/', {
        facility: facilityId,
        page_size: 100
      }, false);
    } catch (error) {
      console.error(`Error fetching contacts for ${facilityId}:`, error.message);
      return []; // Return empty array on error
    }
  },

  /**
   * Get facility equipment/material inventory
   */
  async getFacilityEquipment(facilityId) {
    try {
      const data = await getPaginatedData('/facilities/material/', {
        facility: facilityId,
        page_size: 100
      }, false);
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`Error fetching equipment for ${facilityId}:`, error.message);
      return null;
    }
  },

  /**
   * Get facility officers/staff
   */
  async getFacilityOfficers(facilityId) {
    try {
      return await getPaginatedData('/facilities/officers/', {
        facility: facilityId,
        page_size: 100
      }, false);
    } catch (error) {
      console.error(`Error fetching officers for ${facilityId}:`, error.message);
      return [];
    }
  },

  /**
   * Get human resources for facility
   */
  async getFacilityHumanResources(facilityId) {
    try {
      const response = await retryRequest(() =>
        axiosInstance.get('/facilities/humanresources/', {
          params: { facility: facilityId },
          timeout: API_TIMEOUT
        })
      );
      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching HR for ${facilityId}:`, error.message);
      return [];
    }
  }
};

/**
 * METADATA ENDPOINTS
 */

export const metadataService = {
  /**
   * Get facility types (cached)
   */
  async getFacilityTypes() {
    try {
      return await getPaginatedData('/facilities/facility_types/', {}, true);
    } catch (error) {
      console.error('Error fetching facility types:', error.message);
      throw error;
    }
  },

  /**
   * Get KEPH levels (cached)
   */
  async getKEPHLevels() {
    try {
      return await getPaginatedData('/facilities/keph/', {}, true);
    } catch (error) {
      console.error('Error fetching KEPH levels:', error.message);
      throw error;
    }
  },

  /**
   * Get owner types (cached)
   */
  async getOwnerTypes() {
    try {
      return await getPaginatedData('/facilities/owner_types/', {}, true);
    } catch (error) {
      console.error('Error fetching owner types:', error.message);
      throw error;
    }
  },

  /**
   * Get operation statuses (cached)
   */
  async getOperationStatuses() {
    try {
      return await getPaginatedData('/facilities/operation_statuses/', {}, true);
    } catch (error) {
      console.error('Error fetching operation statuses:', error.message);
      throw error;
    }
  },

  /**
   * Get admission statuses (cached)
   */
  async getAdmissionStatuses() {
    try {
      return await getPaginatedData('/facilities/admission_statuses/', {}, true);
    } catch (error) {
      console.error('Error fetching admission statuses:', error.message);
      throw error;
    }
  },

  /**
   * Get regulatory bodies (cached)
   */
  async getRegulatoryBodies() {
    try {
      return await getPaginatedData('/facilities/regulatory_bodies/', {}, true);
    } catch (error) {
      console.error('Error fetching regulatory bodies:', error.message);
      throw error;
    }
  },

  /**
   * Get regulation statuses (cached)
   */
  async getRegulationStatuses() {
    try {
      return await getPaginatedData('/facilities/regulation_statuses/', {}, true);
    } catch (error) {
      console.error('Error fetching regulation statuses:', error.message);
      throw error;
    }
  },

  /**
   * Get job titles (cached)
   */
  async getJobTitles() {
    try {
      return await getPaginatedData('/facilities/job_titles/', {}, true);
    } catch (error) {
      console.error('Error fetching job titles:', error.message);
      throw error;
    }
  },

  /**
   * Get owners (cached)
   */
  async getOwners() {
    try {
      return await getPaginatedData('/facilities/owners/', {}, true);
    } catch (error) {
      console.error('Error fetching owners:', error.message);
      throw error;
    }
  }
};

/**
 * EQUIPMENT & INFRASTRUCTURE ENDPOINTS
 */

export const infrastructureService = {
  /**
   * Get all infrastructure/equipment types (cached)
   */
  async getInfrastructure(categoryId = null, pageSize = 500) {
    try {
      const params = { page_size: pageSize };
      if (categoryId) params.category = categoryId;
      return await getPaginatedData('/facilities/infrastructure/', params, true);
    } catch (error) {
      console.error('Error fetching infrastructure:', error.message);
      throw error;
    }
  },

  /**
   * Get infrastructure categories (cached)
   */
  async getInfrastructureCategories() {
    try {
      return await getPaginatedData('/facilities/infrastructure_categories/', {}, true);
    } catch (error) {
      console.error('Error fetching infrastructure categories:', error.message);
      throw error;
    }
  },

  /**
   * Get facility material view (equipment inventory)
   */
  async getFacilityMaterial(facilityId) {
    try {
      const data = await getPaginatedData('/facilities/material/', {
        facility: facilityId,
        page_size: 100
      }, false);
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`Error fetching material for ${facilityId}:`, error.message);
      return null;
    }
  }
};

/**
 * SERVICES ENDPOINTS
 */

export const servicesService = {
  /**
   * Get all services (cached)
   */
  async getServices(categoryId = null, kephlevel = null, pageSize = 500) {
    try {
      const params = { page_size: pageSize };
      if (categoryId) params.category = categoryId;
      if (kephlevel) params.keph_level = kephlevel;
      return await getPaginatedData('/facilities/services/', params, true);
    } catch (error) {
      console.error('Error fetching services:', error.message);
      throw error;
    }
  },

  /**
   * Get service categories (cached)
   */
  async getServiceCategories() {
    try {
      return await getPaginatedData('/facilities/service_categories/', {}, true);
    } catch (error) {
      console.error('Error fetching service categories:', error.message);
      throw error;
    }
  },

  /**
   * Get service options (cached)
   */
  async getServiceOptions(serviceId = null) {
    try {
      const params = serviceId ? { service: serviceId } : {};
      return await getPaginatedData('/facilities/service_options/', params, true);
    } catch (error) {
      console.error('Error fetching service options:', error.message);
      throw error;
    }
  },

  /**
   * Get specialities (cached)
   */
  async getSpecialities() {
    try {
      return await getPaginatedData('/facilities/specialities/', {}, true);
    } catch (error) {
      console.error('Error fetching specialities:', error.message);
      throw error;
    }
  },

  /**
   * Get specialities categories (cached)
   */
  async getSpecialitiesCategories() {
    try {
      return await getPaginatedData('/facilities/speciality_categories/', {}, true);
    } catch (error) {
      console.error('Error fetching specialities categories:', error.message);
      throw error;
    }
  }
};

/**
 * GEOGRAPHIC DATA ENDPOINTS
 */

export const geographicService = {
  /**
   * Get all counties (cached)
   */
  async getCounties() {
    try {
      return await getPaginatedData('/common/counties/', {}, true);
    } catch (error) {
      console.error('Error fetching counties:', error.message);
      throw error;
    }
  },

  /**
   * Get constituencies (cached)
   */
  async getConstituencies(countyId = null) {
    try {
      const params = countyId ? { county: countyId } : {};
      return await getPaginatedData('/common/constituencies/', params, true);
    } catch (error) {
      console.error('Error fetching constituencies:', error.message);
      throw error;
    }
  },

  /**
   * Get wards (cached)
   */
  async getWards(constituencyId = null) {
    try {
      const params = constituencyId ? { constituency: constituencyId } : {};
      return await getPaginatedData('/common/wards/', params, true);
    } catch (error) {
      console.error('Error fetching wards:', error.message);
      throw error;
    }
  },

  /**
   * Get towns (cached)
   */
  async getTowns() {
    try {
      return await getPaginatedData('/common/towns/', {}, true);
    } catch (error) {
      console.error('Error fetching towns:', error.message);
      throw error;
    }
  },

  /**
   * Get physical addresses
   */
  async getAddresses(facilityId = null) {
    try {
      const params = facilityId ? { facility: facilityId } : {};
      return await getPaginatedData('/common/address/', params, false);
    } catch (error) {
      console.error('Error fetching addresses:', error.message);
      return [];
    }
  },

  /**
   * Get county boundaries (GIS) - cached
   */
  async getCountyBoundaries(countyId) {
    try {
      const response = await retryRequest(() =>
        axiosInstance.get(`/gis/county_bound/${countyId}/`, { timeout: API_TIMEOUT })
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching county boundaries for ${countyId}:`, error.message);
      return null;
    }
  },

  /**
   * Get constituency boundaries (GIS) - cached
   */
  async getConstituencyBoundaries(constituencyId) {
    try {
      const response = await retryRequest(() =>
        axiosInstance.get(`/gis/constituency_bound/${constituencyId}/`, { timeout: API_TIMEOUT })
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching constituency boundaries for ${constituencyId}:`, error.message);
      return null;
    }
  },

  /**
   * Get ward boundaries (GIS) - cached
   */
  async getWardBoundaries(wardId) {
    try {
      const response = await retryRequest(() =>
        axiosInstance.get(`/gis/ward_bound/${wardId}/`, { timeout: API_TIMEOUT })
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ward boundaries for ${wardId}:`, error.message);
      return null;
    }
  }
};

/**
 * ADMINISTRATIVE OFFICES ENDPOINTS
 */

export const adminService = {
  /**
   * Get admin offices
   */
  async getAdminOffices(countyId = null, isNational = null) {
    try {
      const params = {};
      if (countyId) params.county = countyId;
      if (isNational !== null) params.is_national = isNational;
      return await getPaginatedData('/admin_offices/', params, false);
    } catch (error) {
      console.error('Error fetching admin offices:', error.message);
      return [];
    }
  },

  /**
   * Get specific admin office
   */
  async getAdminOfficeById(officeId) {
    try {
      const response = await retryRequest(() =>
        axiosInstance.get(`/admin_offices/${officeId}/`, { timeout: API_TIMEOUT })
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching admin office ${officeId}:`, error.message);
      throw error;
    }
  },

  /**
   * Get admin office contacts
   */
  async getAdminOfficeContacts(officeId) {
    try {
      return await getPaginatedData('/admin_office_contacts/', {
        admin_office: officeId
      }, false);
    } catch (error) {
      console.error(`Error fetching contacts for admin office ${officeId}:`, error.message);
      return [];
    }
  }
};

/**
 * COMMUNITY HEALTH UNIT (CHU) ENDPOINTS
 */

export const chuService = {
  /**
   * Get all CHUs
   */
  async getCHUs(facilityId = null) {
    try {
      const params = facilityId ? { facility: facilityId } : {};
      return await getPaginatedData('/chul/chu/', params, false);
    } catch (error) {
      console.error('Error fetching CHUs:', error.message);
      return [];
    }
  },

  /**
   * Get CHU facility linkages
   */
  async getCHUFacilityLinkage(chuId = null) {
    try {
      const params = chuId ? { chu: chuId } : {};
      return await getPaginatedData('/chul/chul_facility_linkage/', params, false);
    } catch (error) {
      console.error('Error fetching CHU facility linkage:', error.message);
      return [];
    }
  },

  /**
   * Get CHU ratings
   */
  async getCHURatings() {
    try {
      return await getPaginatedData('/chul/chu_ratings/', {}, false);
    } catch (error) {
      console.error('Error fetching CHU ratings:', error.message);
      return [];
    }
  }
};

/**
 * HEALTH CHECK & STATUS
 */

export async function healthCheck() {
  try {
    const response = await retryRequest(() =>
      axiosInstance.get('/health/', { timeout: 5000 })
    );
    return { status: 'ok', data: response.data };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Cache management utilities
 */

export const cacheService = {
  clear: () => cache.flushAll(),
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  getStats: () => cache.getStats()
};

export default {
  facilitiesService,
  metadataService,
  infrastructureService,
  servicesService,
  geographicService,
  adminService,
  chuService,
  healthCheck,
  cacheService
};
