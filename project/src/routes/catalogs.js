/**
 * PDF Catalog Routes (Optional)
 * Add to server.js if you want HTTP endpoints for PDF generation
 * 
 * Endpoints:
 *   POST   /api/catalogs/generate      - Generate from machines API
 *   POST   /api/catalogs/generate-data - Generate from request body
 *   GET    /api/catalogs/list          - List all generated catalogs
 *   GET    /api/catalogs/:filename     - Download catalog
 *   DELETE /api/catalogs/:filename     - Delete catalog
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import pdfCatalogService from '../services/pdfCatalogService.js';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/catalogs/generate
 * Generate PDF from machines API endpoint
 */
router.post('/generate', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { apiUrl, company, filename } = req.body;

    if (!apiUrl) {
      return res.status(400).json({
        success: false,
        message: 'apiUrl is required',
        example: {
          apiUrl: 'http://localhost:5000/api/machines',
          company: 'ACCORD Medical',
          filename: 'catalog.pdf'
        }
      });
    }

    const result = await pdfCatalogService.generateFromAPI(apiUrl, {
      company: company || 'ACCORD Medical',
      filename: filename || `catalog-${Date.now()}.pdf`
    });

    res.status(201).json({
      success: true,
      message: 'PDF catalog generated successfully',
      data: {
        filename: result.filename,
        path: `/api/catalogs/${result.filename}`,
        size: (result.size / 1024).toFixed(2) + ' KB',
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Error generating catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF catalog',
      error: error.message
    });
  }
});

/**
 * POST /api/catalogs/generate-data
 * Generate PDF from provided product data
 */
router.post('/generate-data', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { products, company, filename } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'products array is required and must not be empty'
      });
    }

    const result = await pdfCatalogService.generateFromData(products, {
      company: company || 'ACCORD Medical',
      filename: filename || `catalog-${Date.now()}.pdf`
    });

    res.status(201).json({
      success: true,
      message: 'PDF catalog generated from data',
      data: {
        filename: result.filename,
        path: `/api/catalogs/${result.filename}`,
        size: (result.size / 1024).toFixed(2) + ' KB',
        productsIncluded: products.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Error generating catalog from data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF catalog',
      error: error.message
    });
  }
});

/**
 * GET /api/catalogs/list
 * List all generated catalogs
 */
router.get('/list', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const catalogs = pdfCatalogService.listCatalogs();

    res.json({
      success: true,
      message: 'Catalogs retrieved',
      data: {
        total: catalogs.length,
        catalogs: catalogs.map(cat => ({
          filename: cat.name,
          size: (cat.size / 1024).toFixed(2) + ' KB',
          created: cat.created,
          downloadUrl: `/api/catalogs/${cat.name}`
        }))
      }
    });

  } catch (error) {
    logger.error('Error listing catalogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing catalogs',
      error: error.message
    });
  }
});

/**
 * GET /api/catalogs/:filename
 * Download a catalog PDF
 */
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filepath = path.join(pdfCatalogService.getCatalogDir(), filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }

    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error('Error downloading file:', err);
      }
    });

  } catch (error) {
    logger.error('Error downloading catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading catalog',
      error: error.message
    });
  }
});

/**
 * DELETE /api/catalogs/:filename
 * Delete a catalog (admin only)
 */
router.delete('/:filename', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { filename } = req.params;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const deleted = pdfCatalogService.deleteCatalog(filename);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }

    res.json({
      success: true,
      message: 'Catalog deleted successfully',
      data: { filename }
    });

  } catch (error) {
    logger.error('Error deleting catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting catalog',
      error: error.message
    });
  }
});

export default router;
