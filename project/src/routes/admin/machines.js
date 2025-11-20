import express from 'express';
import mongoose from 'mongoose';
import Machine from '../../models/Machine.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Admin: bulk create machines (accepts array of machine objects)
router.post('/bulk', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const machinesArray = req.body;

    // Validate input is an array
    if (!Array.isArray(machinesArray)) {
      return res.status(400).json({ success: false, error: 'Request body must be an array of machines' });
    }

    if (machinesArray.length === 0) {
      return res.status(400).json({ success: false, error: 'Array cannot be empty' });
    }

    // Validate each machine has required fields
    const validationErrors = [];
    machinesArray.forEach((machine, index) => {
      const errors = [];
      if (!machine.model) errors.push('model');
      if (!machine.manufacturer) errors.push('manufacturer');
      if (!machine.facility || !machine.facility.name) errors.push('facility.name');
      
      if (errors.length > 0) {
        validationErrors.push({ index, missingFields: errors });
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `${validationErrors.length} machine(s) missing required fields`,
        details: validationErrors
      });
    }

    // Add metadata to each machine
    const machinesWithMeta = machinesArray.map(machine => ({
      ...machine,
      metadata: {
        createdBy: req.user._id
      }
    }));

    // Insert all machines (ordered: false continues on error)
    const results = await Machine.insertMany(machinesWithMeta, { ordered: false });
    
    logger.info('Admin bulk machines created', { 
      userId: req.user._id, 
      count: results.length,
      userEmail: req.user.email 
    });

    res.status(201).json({ 
      success: true, 
      message: `${results.length} machines created successfully`,
      data: { 
        count: results.length,
        machines: results 
      }
    });
  } catch (err) {
    logger.error('Admin bulk create machines error:', err);
    
    // Handle duplicate key errors (e.g., duplicate serial numbers)
    if (err.code === 11000) {
      // Some machines may have been inserted before the error
      const insertedCount = err.insertedDocs ? err.insertedDocs.length : 0;
      return res.status(207).json({ 
        success: true, 
        message: `${insertedCount} machines created, some failed due to duplicates`,
        data: {
          count: insertedCount,
          error: 'Duplicate machine detected (check serial numbers)',
          details: err.writeErrors || []
        }
      });
    }
    
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: create a single machine
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const payload = { ...req.body };

    // Basic validation
    const missing = [];
    if (!payload.model) missing.push('model');
    if (!payload.manufacturer) missing.push('manufacturer');
    if (!payload.facility || !payload.facility.name) missing.push('facility.name');

    if (missing.length > 0) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    }

    payload.metadata = payload.metadata || {};
    payload.metadata.createdBy = req.user._id;

    const machine = new Machine(payload);
    await machine.save();

    // Populate createdBy for response
    await machine.populate('metadata.createdBy', 'firstName lastName email');

    res.status(201).json({ success: true, message: 'Machine created', data: machine });
  } catch (err) {
    logger.error('Admin create machine error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Duplicate key error', details: err.keyValue });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: list machines with filters
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 20, facilityName, model, manufacturer, search } = req.query;
    const query = {};
    if (facilityName) query['facility.name'] = new RegExp(facilityName, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (manufacturer) query.manufacturer = new RegExp(manufacturer, 'i');
    if (search) query.$text = { $search: search };

    const results = await Machine.paginate(query, { page: Number(page), limit: Number(limit), sort: { createdAt: -1 } });
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Admin list machines error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: get machine
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid machine id' });
    const machine = await Machine.findById(req.params.id).populate('metadata.createdBy', 'firstName lastName email');
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });
    res.json({ success: true, data: machine });
  } catch (err) {
    logger.error('Admin get machine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: update machine
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid machine id' });
    const machine = await Machine.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });
    res.json({ success: true, message: 'Machine updated', data: machine });
  } catch (err) {
    logger.error('Admin update machine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: delete machine
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid machine id' });
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });
    res.json({ success: true, message: 'Machine deleted' });
  } catch (err) {
    logger.error('Admin delete machine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: trigger machines due report (POST /api/admin/machines/reports/due?days=5)
router.post('/reports/due', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : (req.body.days ? Number(req.body.days) : 5);
    const recipients = req.body.recipients || (process.env.MACHINE_REMINDER_RECIPIENTS ? process.env.MACHINE_REMINDER_RECIPIENTS.split(',') : []);

    const { sendMachinesDueReport } = await import('../../services/machineReports.js');
    const result = await sendMachinesDueReport({ days, recipients, page: 1, limit: 1000 });

    res.json({ success: true, message: 'Report queued', data: result });
  } catch (err) {
    logger.error('Admin trigger machines due report error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
