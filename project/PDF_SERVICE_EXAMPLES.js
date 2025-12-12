// PDF Service Integration Examples
// These are copy-paste examples for using the PDF service in your code

// ============================================================================
// EXAMPLE 1: Using in a Controller
// ============================================================================

import pdfCatalogService from '../services/pdfCatalogService.js';
import { logger } from '../utils/logger.js';
import Machine from '../models/Machine.js';

export const downloadCatalog = async (req, res) => {
  try {
    // Fetch machines from database
    const machines = await Machine.find().lean();
    
    // Generate PDF
    const result = await pdfCatalogService.generateFromData(machines, {
      company: req.body.company || 'ACCORD Medical'
    });
    
    // Download the PDF
    res.download(result.filepath, result.filename);
    
  } catch (error) {
    logger.error('Catalog download error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ============================================================================
// EXAMPLE 2: Using in a Route Handler
// ============================================================================

import express from 'express';
import pdfCatalogService from '../services/pdfCatalogService.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate catalog from database
router.post('/generate-from-db', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const machines = await Machine.find().lean();
    
    const result = await pdfCatalogService.generateFromData(machines, {
      company: req.body.company || 'ACCORD Medical',
      filename: req.body.filename || 'database-catalog.pdf'
    });
    
    res.status(201).json({
      success: true,
      message: 'Catalog generated successfully',
      data: {
        filepath: result.filepath,
        filename: result.filename,
        size: result.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all catalogs
router.get('/list', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const catalogs = await pdfCatalogService.listCatalogs();
    
    res.json({
      success: true,
      data: catalogs,
      total: catalogs.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

// ============================================================================
// EXAMPLE 3: Using in a Service/Utility
// ============================================================================

import pdfCatalogService from '../services/pdfCatalogService.js';
import emailService from '../services/emailService.js';
import { logger } from '../utils/logger.js';

export const emailCatalogService = {
  
  // Send catalog via email to user
  sendCatalogToUser: async (userId, userEmail, companyName) => {
    try {
      // Get machines
      const machines = await Machine.find().lean();
      
      // Generate PDF
      const result = await pdfCatalogService.generateFromData(machines, {
        company: companyName,
        filename: `catalog-${userId}.pdf`
      });
      
      // Send email with attachment
      await emailService.sendEmail({
        to: userEmail,
        subject: `Product Catalog - ${companyName}`,
        template: 'catalog-email',
        attachments: [
          {
            filename: result.filename,
            path: result.filepath,
            contentType: 'application/pdf'
          }
        ]
      });
      
      logger.info(`Catalog emailed to ${userEmail}`);
      return { success: true };
      
    } catch (error) {
      logger.error('Error sending catalog:', error);
      throw error;
    }
  },
  
  // Send catalog to multiple users
  sendCatalogToMultiple: async (userIds, companyName) => {
    const machines = await Machine.find().lean();
    const result = await pdfCatalogService.generateFromData(machines, { company: companyName });
    
    const promises = userIds.map(userId =>
      User.findById(userId).then(user =>
        emailService.sendEmail({
          to: user.email,
          subject: `Product Catalog - ${companyName}`,
          template: 'catalog-email',
          attachments: [{ path: result.filepath }]
        })
      )
    );
    
    await Promise.all(promises);
    logger.info(`Catalog sent to ${userIds.length} users`);
  }
};

// ============================================================================
// EXAMPLE 4: Using in a Scheduled Job (Cron)
// ============================================================================

import CronJob from 'cron';
import pdfCatalogService from '../services/pdfCatalogService.js';
import { logger } from '../utils/logger.js';

// Generate catalog every day at 8 AM
const dailyCatalogJob = new CronJob('0 8 * * *', async () => {
  try {
    const machines = await Machine.find().lean();
    
    const result = await pdfCatalogService.generateFromData(machines, {
      company: 'ACCORD Medical',
      filename: `daily-catalog-${new Date().toISOString().split('T')[0]}.pdf`
    });
    
    logger.info(`Daily catalog generated: ${result.filename}`);
    
  } catch (error) {
    logger.error('Daily catalog generation failed:', error);
  }
});

dailyCatalogJob.start();

// ============================================================================
// EXAMPLE 5: Using with External API Data
// ============================================================================

import pdfCatalogService from '../services/pdfCatalogService.js';

export const generateFromExternalAPI = async (req, res) => {
  try {
    const { apiUrl, company, filename } = req.body;
    
    // Validate inputs
    if (!apiUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'apiUrl is required' 
      });
    }
    
    // Generate from external API
    const result = await pdfCatalogService.generateFromAPI(apiUrl, {
      company: company || 'ACCORD Medical',
      filename: filename || 'external-catalog.pdf'
    });
    
    res.status(201).json({
      success: true,
      message: 'Catalog generated from external API',
      data: {
        filepath: result.filepath,
        filename: result.filename,
        size: result.size
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ============================================================================
// EXAMPLE 6: Using in Admin Panel (React Frontend)
// ============================================================================

// AdminPanel.jsx or similar
import { useState } from 'react';
import axios from 'axios';

export const AdminCatalogPanel = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [catalogs, setCatalogs] = useState([]);
  
  const token = localStorage.getItem('token');
  
  // Generate catalog from machines API
  const handleGenerateCatalog = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/catalogs/generate',
        {
          apiUrl: '/api/machines',
          company: 'ACCORD Medical'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage(`Catalog generated: ${response.data.data.filename}`);
      loadCatalogs();
      
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate from custom data
  const handleGenerateFromData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/catalogs/generate-data',
        {
          products: [
            { name: 'Product 1', description: 'Description 1', facility: { name: 'Lab' } },
            { name: 'Product 2', description: 'Description 2', facility: { name: 'Lab' } }
          ],
          company: 'ACCORD Medical'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage(`Catalog generated: ${response.data.data.filename}`);
      loadCatalogs();
      
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // List all catalogs
  const loadCatalogs = async () => {
    try {
      const response = await axios.get(
        '/api/catalogs/list',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setCatalogs(response.data.data);
      
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };
  
  // Download catalog
  const handleDownload = (filename) => {
    window.location.href = `/api/catalogs/${filename}`;
  };
  
  // Delete catalog
  const handleDelete = async (filename) => {
    if (!window.confirm('Delete this catalog?')) return;
    
    try {
      await axios.delete(
        `/api/catalogs/${filename}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage('Catalog deleted');
      loadCatalogs();
      
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    }
  };
  
  return (
    <div className="catalog-panel">
      <h2>Product Catalog Manager</h2>
      
      <div className="actions">
        <button 
          onClick={handleGenerateCatalog} 
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate from Machines API'}
        </button>
        
        <button 
          onClick={handleGenerateFromData} 
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate from Custom Data'}
        </button>
      </div>
      
      {message && <p className="message">{message}</p>}
      
      <div className="catalogs-list">
        <h3>Generated Catalogs</h3>
        {catalogs.length === 0 ? (
          <p>No catalogs generated yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Size (KB)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map(catalog => (
                <tr key={catalog.filename}>
                  <td>{catalog.filename}</td>
                  <td>{(catalog.size / 1024).toFixed(2)} KB</td>
                  <td>
                    <button onClick={() => handleDownload(catalog.filename)}>
                      Download
                    </button>
                    <button onClick={() => handleDelete(catalog.filename)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 7: Error Handling Best Practices
// ============================================================================

import pdfCatalogService from '../services/pdfCatalogService.js';
import { logger } from '../utils/logger.js';

export const robustCatalogGeneration = async (req, res) => {
  try {
    // Validate input
    if (!req.body.apiUrl && !req.body.products) {
      return res.status(400).json({
        success: false,
        error: 'Either apiUrl or products array is required'
      });
    }
    
    // Check for malicious input
    const filename = req.body.filename || 'catalog.pdf';
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    // Generate PDF with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
    );
    
    const generatePromise = req.body.apiUrl
      ? pdfCatalogService.generateFromAPI(req.body.apiUrl, { filename })
      : pdfCatalogService.generateFromData(req.body.products, { filename });
    
    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    // Log success
    logger.info(`Catalog generated: ${result.filename}`);
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'Catalog generated successfully',
      data: {
        filepath: result.filepath,
        filename: result.filename,
        size: result.size,
        downloadUrl: `/api/catalogs/${result.filename}`
      }
    });
    
  } catch (error) {
    // Log error
    logger.error('Catalog generation error:', error);
    
    // Return appropriate error response
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: 'PDF generation took too long. Try with fewer products.'
      });
    }
    
    if (error.message.includes('API')) {
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch data from external API'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// ============================================================================
// EXAMPLE 8: Filtering Products Before Generation
// ============================================================================

import pdfCatalogService from '../services/pdfCatalogService.js';
import Machine from '../models/Machine.js';
import Facility from '../models/Facility.js';

export const generateCatalogByFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { companyName } = req.body;
    
    // Get facility
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }
    
    // Get machines for this facility
    const machines = await Machine.find({ facility: facilityId }).lean();
    
    if (machines.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No machines found for this facility' 
      });
    }
    
    // Generate catalog with facility name
    const result = await pdfCatalogService.generateFromData(machines, {
      company: companyName || facility.name,
      filename: `catalog-${facility.slug}.pdf`
    });
    
    res.status(201).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// EXAMPLE 9: Batch Catalog Generation
// ============================================================================

import pdfCatalogService from '../services/pdfCatalogService.js';
import Facility from '../models/Facility.js';
import Machine from '../models/Machine.js';

export const generateAllFacilityCatalogs = async (req, res) => {
  try {
    const facilities = await Facility.find().lean();
    const results = [];
    const errors = [];
    
    for (const facility of facilities) {
      try {
        const machines = await Machine.find({ facility: facility._id }).lean();
        
        if (machines.length > 0) {
          const result = await pdfCatalogService.generateFromData(machines, {
            company: facility.name,
            filename: `${facility.slug}-catalog.pdf`
          });
          
          results.push({
            facility: facility.name,
            filename: result.filename,
            status: 'success'
          });
        }
      } catch (error) {
        errors.push({
          facility: facility.name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: errors.length === 0,
      generated: results,
      errors: errors,
      total: { generated: results.length, failed: errors.length }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// These are just examples. Adapt them to your specific needs!
// ============================================================================
