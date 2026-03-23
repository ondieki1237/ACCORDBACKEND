import express from 'express';
import {
  facilitiesService,
  metadataService,
  infrastructureService,
  servicesService,
  geographicService,
  adminService,
  chuService,
  healthCheck,
  cacheService
} from '../services/kmhfr.service.js';
import { KMHFRFacility, KMHFRMetadata, KMHFRSyncLog } from '../models/KMHFRFacility.js';

const router = express.Router();

// ============================================
// UTILITIES & HEALTH CHECK
// ============================================

/**
 * Health check
 */
router.get('/health', async (req, res) => {
  try {
    const result = await healthCheck();
    res.json(result);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * Cache statistics
 */
router.get('/cache/stats', (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({ cache_stats: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear cache
 */
router.post('/cache/clear', (req, res) => {
  try {
    cacheService.clear();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FACILITIES ENDPOINTS
// ============================================

/**
 * Get facilities with filters
 */
router.get('/facilities/', async (req, res) => {
  try {
    const filters = {
      name: req.query.name,
      code: req.query.code,
      facility_type: req.query.facility_type,
      county: req.query.county,
      county_code: req.query.county_code,
      constituency: req.query.constituency,
      ward: req.query.ward,
      owner: req.query.owner,
      operation_status: req.query.operation_status,
      is_regulated: req.query.is_regulated === 'true',
      is_published: req.query.is_published === 'true',
      open_whole_day: req.query.open_whole_day === 'true',
      page: parseInt(req.query.page) || 1,
      page_size: parseInt(req.query.page_size) || 50,
      ordering: req.query.ordering
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const data = await facilitiesService.getFacilities(filters);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get facility by ID
 */
router.get('/facilities/:id', async (req, res) => {
  try {
    const facility = await facilitiesService.getFacilityById(req.params.id);
    res.json(facility);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * Search facilities
 */
router.get('/facilities/search/:query', async (req, res) => {
  try {
    const results = await facilitiesService.searchFacilities(req.params.query);
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get facility contacts
 */
router.get('/facilities/:id/contacts', async (req, res) => {
  try {
    const contacts = await facilitiesService.getFacilityContacts(req.params.id);
    res.json({ contacts, count: contacts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get facility equipment/inventory
 */
router.get('/facilities/:id/equipment', async (req, res) => {
  try {
    const equipment = await facilitiesService.getFacilityEquipment(req.params.id);
    res.json(equipment || { message: 'No equipment data available' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get facility officers
 */
router.get('/facilities/:id/officers', async (req, res) => {
  try {
    const officers = await facilitiesService.getFacilityOfficers(req.params.id);
    res.json({ officers, count: officers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get facility human resources
 */
router.get('/facilities/:id/hr', async (req, res) => {
  try {
    const hr = await facilitiesService.getFacilityHumanResources(req.params.id);
    res.json({ hr, count: hr.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// METADATA ENDPOINTS
// ============================================

/**
 * Get facility types
 */
router.get('/metadata/facility-types', async (req, res) => {
  try {
    const data = await metadataService.getFacilityTypes();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get KEPH levels
 */
router.get('/metadata/keph-levels', async (req, res) => {
  try {
    const data = await metadataService.getKEPHLevels();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get owner types
 */
router.get('/metadata/owner-types', async (req, res) => {
  try {
    const data = await metadataService.getOwnerTypes();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get operation statuses
 */
router.get('/metadata/operation-statuses', async (req, res) => {
  try {
    const data = await metadataService.getOperationStatuses();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get admission statuses
 */
router.get('/metadata/admission-statuses', async (req, res) => {
  try {
    const data = await metadataService.getAdmissionStatuses();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get regulatory bodies
 */
router.get('/metadata/regulatory-bodies', async (req, res) => {
  try {
    const data = await metadataService.getRegulatoryBodies();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get regulation statuses
 */
router.get('/metadata/regulation-statuses', async (req, res) => {
  try {
    const data = await metadataService.getRegulationStatuses();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get job titles
 */
router.get('/metadata/job-titles', async (req, res) => {
  try {
    const data = await metadataService.getJobTitles();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get owners
 */
router.get('/metadata/owners', async (req, res) => {
  try {
    const data = await metadataService.getOwners();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// INFRASTRUCTURE & EQUIPMENT ENDPOINTS
// ============================================

/**
 * Get infrastructure/equipment types
 */
router.get('/infrastructure/', async (req, res) => {
  try {
    const categoryId = req.query.category;
    const data = await infrastructureService.getInfrastructure(categoryId);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get infrastructure categories
 */
router.get('/infrastructure/categories', async (req, res) => {
  try {
    const data = await infrastructureService.getInfrastructureCategories();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get facility material/inventory
 */
router.get('/facilities/:id/material', async (req, res) => {
  try {
    const data = await infrastructureService.getFacilityMaterial(req.params.id);
    res.json(data || { message: 'No material data available' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// SERVICES ENDPOINTS
// ============================================

/**
 * Get services
 */
router.get('/services/', async (req, res) => {
  try {
    const categoryId = req.query.category;
    const kephlevel = req.query.keph_level;
    const data = await servicesService.getServices(categoryId, kephlevel);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get service categories
 */
router.get('/services/categories', async (req, res) => {
  try {
    const data = await servicesService.getServiceCategories();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get service options
 */
router.get('/services/options', async (req, res) => {
  try {
    const serviceId = req.query.service;
    const data = await servicesService.getServiceOptions(serviceId);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get specialities
 */
router.get('/services/specialities', async (req, res) => {
  try {
    const data = await servicesService.getSpecialities();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get specialities categories
 */
router.get('/services/specialities/categories', async (req, res) => {
  try {
    const data = await servicesService.getSpecialitiesCategories();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// GEOGRAPHIC DATA ENDPOINTS
// ============================================

/**
 * Get counties
 */
router.get('/geographic/counties', async (req, res) => {
  try {
    const data = await geographicService.getCounties();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get constituencies
 */
router.get('/geographic/constituencies', async (req, res) => {
  try {
    const countyId = req.query.county;
    const data = await geographicService.getConstituencies(countyId);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get wards
 */
router.get('/geographic/wards', async (req, res) => {
  try {
    const constituencyId = req.query.constituency;
    const data = await geographicService.getWards(constituencyId);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get towns
 */
router.get('/geographic/towns', async (req, res) => {
  try {
    const data = await geographicService.getTowns();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get physical addresses
 */
router.get('/geographic/addresses', async (req, res) => {
  try {
    const facilityId = req.query.facility;
    const data = await geographicService.getAddresses(facilityId);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get county boundaries (GIS)
 */
router.get('/geographic/county-boundaries/:id', async (req, res) => {
  try {
    const data = await geographicService.getCountyBoundaries(req.params.id);
    res.json(data || { message: 'Boundaries not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get constituency boundaries (GIS)
 */
router.get('/geographic/constituency-boundaries/:id', async (req, res) => {
  try {
    const data = await geographicService.getConstituencyBoundaries(req.params.id);
    res.json(data || { message: 'Boundaries not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get ward boundaries (GIS)
 */
router.get('/geographic/ward-boundaries/:id', async (req, res) => {
  try {
    const data = await geographicService.getWardBoundaries(req.params.id);
    res.json(data || { message: 'Boundaries not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ADMINISTRATIVE OFFICES ENDPOINTS
// ============================================

/**
 * Get admin offices
 */
router.get('/admin-offices/', async (req, res) => {
  try {
    const countyId = req.query.county;
    const isNational = req.query.is_national === 'true' ? true : null;
    const data = await adminService.getAdminOffices(countyId, isNational);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get specific admin office
 */
router.get('/admin-offices/:id', async (req, res) => {
  try {
    const data = await adminService.getAdminOfficeById(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get admin office contacts
 */
router.get('/admin-offices/:id/contacts', async (req, res) => {
  try {
    const data = await adminService.getAdminOfficeContacts(req.params.id);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// COMMUNITY HEALTH UNITS (CHU) ENDPOINTS
// ============================================

/**
 * Get CHUs
 */
router.get('/chu/', async (req, res) => {
  try {
    const facilityId = req.query.facility;
    const data = await chuService.getCHUs(facilityId);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get CHU facility linkage
 */
router.get('/chu/facility-linkage', async (req, res) => {
  try {
    const chuId = req.query.chu;
    const data = await chuService.getCHUFacilityLinkage(chuId);
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get CHU ratings
 */
router.get('/chu/ratings', async (req, res) => {
  try {
    const data = await chuService.getCHURatings();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// DATABASE SYNC ENDPOINTS (Admin only)
// ============================================

/**
 * Get sync logs
 */
router.get('/sync/logs', async (req, res) => {
  try {
    const logs = await KMHFRSyncLog.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ logs, count: logs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Cache metadata in MongoDB
 */
router.post('/sync/metadata', async (req, res) => {
  try {
    const startTime = Date.now();
    const syncLog = new KMHFRSyncLog({
      endpoint: 'metadata',
      status: 'in_progress',
      started_at: new Date()
    });

    // Sync all metadata types
    const metadataTypes = [
      { name: 'facility_types', fn: () => metadataService.getFacilityTypes() },
      { name: 'keph_levels', fn: () => metadataService.getKEPHLevels() },
      { name: 'owner_types', fn: () => metadataService.getOwnerTypes() },
      { name: 'operation_statuses', fn: () => metadataService.getOperationStatuses() },
      { name: 'admission_statuses', fn: () => metadataService.getAdmissionStatuses() },
      { name: 'regulatory_bodies', fn: () => metadataService.getRegulatoryBodies() },
      { name: 'regulation_statuses', fn: () => metadataService.getRegulationStatuses() },
      { name: 'job_titles', fn: () => metadataService.getJobTitles() },
      { name: 'owners', fn: () => metadataService.getOwners() }
    ];

    let totalRecords = 0;
    for (const metadata of metadataTypes) {
      try {
        const data = await metadata.fn();
        await KMHFRMetadata.findOneAndUpdate(
          { type: metadata.name },
          {
            type: metadata.name,
            items: data,
            total_count: data.length,
            last_synced: new Date()
          },
          { upsert: true }
        );
        totalRecords += data.length;
      } catch (error) {
        console.error(`Error syncing ${metadata.name}:`, error.message);
      }
    }

    syncLog.status = 'completed';
    syncLog.total_records = totalRecords;
    syncLog.synced_records = totalRecords;
    syncLog.completed_at = new Date();
    syncLog.duration_ms = Date.now() - startTime;
    await syncLog.save();

    res.json({
      success: true,
      message: 'Metadata sync completed',
      total_records: totalRecords,
      duration_ms: syncLog.duration_ms
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
