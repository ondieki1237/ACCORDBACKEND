import express from 'express';
import axios from 'axios';
import countiesFallback from '../data/counties.js';

const router = express.Router();
const KMHFR_BASE = 'https://kmhfr.vercel.app/api';

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// App status (optional)
router.get('/status', (req, res) => {
  res.json({ status: 'running', uptime: process.uptime() });
});

// --- Facilities ---

// Search facilities (proxy)
// Search facilities (proxy) - DISABLED: Conflicts with local facilities API
// router.get('/facilities/search', async (req, res) => {
//   try {
//     const { name, county, limit, page } = req.query;
//     const params = new URLSearchParams();
//     if (name) params.append('name', name);
//     if (county) params.append('county', county);
//     if (limit) params.append('limit', limit);
//     if (page) params.append('page', page);
//
//     const url = `${KMHFR_BASE}/facilities/?${params.toString()}`;
//     const response = await axios.get(url);
//     res.json(response.data);
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to search facilities', error: err.message });
//   }
// });

// List facilities (paginated)
// List facilities (paginated) - DISABLED: Conflicts with local facilities API
// router.get('/facilities', async (req, res) => {
//   try {
//     const { limit, page, county, ward } = req.query;
//     const params = new URLSearchParams();
//     if (limit) params.append('limit', limit);
//     if (page) params.append('page', page);
//     if (county) params.append('county', county);
//     if (ward) params.append('ward', ward);
//
//     const url = `${KMHFR_BASE}/facilities/?${params.toString()}`;
//     const response = await axios.get(url);
//     res.json(response.data);
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to list facilities', error: err.message });
//   }
// });

// Facility detail
// Facility detail - DISABLED: Conflicts with local facilities API
// router.get('/facilities/:id', async (req, res) => {
//   try {
//     const url = `${KMHFR_BASE}/facilities/${req.params.id}/`;
//     const response = await axios.get(url);
//     res.json(response.data);
//   } catch (err) {
//     res.status(404).json({ success: false, message: 'Facility not found', error: err.message });
//   }
// });

// Facility report (JSON or PDF)
router.get('/facilities/:id/report', async (req, res) => {
  try {
    const { format } = req.query;
    const url = `${KMHFR_BASE}/facilities/${req.params.id}/report/?format=${format || 'json'}`;
    const response = await axios.get(url, { responseType: format === 'pdf' ? 'arraybuffer' : 'json' });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.send(response.data);
    } else {
      res.json(response.data);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch facility report', error: err.message });
  }
});

// Facility services
router.get('/facilities/:id/services', async (req, res) => {
  try {
    const url = `${KMHFR_BASE}/facilities/${req.params.id}/services/`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch facility services', error: err.message });
  }
});

// Facility infrastructure/equipment
router.get('/facilities/:id/infrastructure', async (req, res) => {
  try {
    const url = `${KMHFR_BASE}/facilities/${req.params.id}/infrastructure/`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch facility infrastructure', error: err.message });
  }
});

// Facility types
router.get('/facilities/facility_types', async (req, res) => {
  try {
    const url = `${KMHFR_BASE}/facilities/facility_types/`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch facility types', error: err.message });
  }
});

// Facility services catalog
router.get('/facilities/services', async (req, res) => {
  try {
    const url = `${KMHFR_BASE}/facilities/services/`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch services catalog', error: err.message });
  }
});

// --- Common / Metadata ---

// Counties
router.get('/common/counties', async (req, res) => {
  try {
    const url = `${KMHFR_BASE}/common/counties/`;
    const response = await axios.get(url, { timeout: 5000 });
    // Ensure response has expected shape
    if (!response || !response.data) throw new Error('Invalid response from KMHFR service');
    return res.json(response.data);
  } catch (err) {
    // Log and return local fallback so admin UI remains usable
    console.error('KMHFR /common/counties fetch failed:', err.message);
    return res.json({ success: true, data: countiesFallback, note: 'served from local fallback due to external service error' });
  }
});

// Wards by county
router.get('/common/wards', async (req, res) => {
  try {
    const { county } = req.query;
    const url = `${KMHFR_BASE}/common/wards/?county=${county}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch wards', error: err.message });
  }
});

// --- Edge Cases & Error Testing ---

// Invalid facility id
router.get('/facilities/invalid-id-test-000', (req, res) => {
  res.status(404).json({ success: false, message: 'Invalid facility id' });
});

// Not found UUID (all-zero)
router.get('/facilities/00000000-0000-0000-0000-000000000000', (req, res) => {
  res.status(404).json({ success: false, message: 'Facility not found' });
});

// --- Useful Additions ---

// Constituencies endpoint
router.get('/common/constituencies', async (req, res) => {
  try {
    const { county } = req.query;
    const url = `${KMHFR_BASE}/common/constituencies/${county ? '?county=' + county : ''}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch constituencies', error: err.message });
  }
});

// Facility Contacts
router.get('/facilities/:id/contacts', async (req, res) => {
  try {
    const url = `${KMHFR_BASE}/facilities/${req.params.id}/contacts/`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch facility contacts', error: err.message });
  }
});

// Infrastructure catalog
router.get('/facilities/infrastructure', async (req, res) => {
  try {
    const url = `${KMHFR_BASE}/facilities/infrastructure/`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch infrastructure catalog', error: err.message });
  }
});

// Export endpoints (Excel/CSV)
router.get('/facilities/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query; // csv or excel
    const url = `${KMHFR_BASE}/facilities/?format=${format}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv');
    res.send(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export facilities', error: err.message });
  }
});

// Authentication (optional)
router.post('/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${KMHFR_BASE}/rest-auth/login/`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(401).json({ success: false, message: 'Login failed', error: err.message });
  }
});

export default router;