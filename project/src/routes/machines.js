import express from 'express';
import mongoose from 'mongoose';
import Machine from '../models/Machine.js';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getServicesByMachine } from '../controllers/engineeringServiceController.js';

const router = express.Router();

// Bulk create machines (accepts array of machine objects)
router.post('/bulk', authenticate, async (req, res) => {
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

    // Insert all machines
    const results = await Machine.insertMany(machinesWithMeta, { ordered: false });
    
    logger.info('Bulk machines created', { 
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
    logger.error('Bulk create machines error:', err);
    
    // Handle duplicate key errors (e.g., duplicate serial numbers)
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Duplicate machine detected (check serial numbers)',
        details: err.message 
      });
    }
    
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create machine (engineers or admin/manager)
router.post('/', authenticate, async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.metadata = payload.metadata || {};
    payload.metadata.createdBy = req.user._id;

    const machine = new Machine(payload);
    await machine.save();

    res.status(201).json({ success: true, message: 'Machine created', data: machine });
  } catch (err) {
    logger.error('Create machine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// List machines (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, facilityName, model, manufacturer, search } = req.query;
    const query = {};
    if (facilityName) query['facility.name'] = new RegExp(facilityName, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (manufacturer) query.manufacturer = new RegExp(manufacturer, 'i');
    if (search) query.$text = { $search: search };

    const options = { page: Number(page), limit: Number(limit), sort: { createdAt: -1 } };
    const results = await Machine.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('List machines error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/machines/due?days=5&page=1&limit=100 or ?overdue=true
router.get('/due', authenticate, async (req, res) => {
  try {
    const { days = 5, page = 1, limit = 100, overdue } = req.query;
    const query = {};

    if (overdue === 'true' || overdue === true) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.nextServiceDue = { $lt: today };
    } else {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + Number(days));
      query.nextServiceDue = { $gte: start, $lte: end };
    }

    const options = { page: Number(page), limit: Number(limit), sort: { 'facility.name': 1, model: 1, serialNumber: 1 } };

    const results = await Machine.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Get machines due error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single machine
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid machine id' });
    const machine = await Machine.findById(req.params.id).populate('metadata.createdBy', 'firstName lastName email');
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });
    res.json({ success: true, data: machine });
  } catch (err) {
    logger.error('Get machine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get service history for a machine
router.get('/:id/services', authenticate, async (req, res, next) => {
  try {
    // Role-based filtering: admin/manager can view all; engineers can view services assigned to them; sales can view services they created
    // For engineers and sales, we limit results inside the controller by injecting query params
    const userRole = req.user.role;

    if (userRole === 'engineer') {
      // engineers should only see services where they are the assigned engineer
      req.query.engineerId = req.user._id.toString();
    } else if (userRole === 'sales') {
      // sales see services they created
      req.query.userId = req.user._id.toString();
    } else if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Pass through to engineering service controller which will validate machine id and paginate
    return getServicesByMachine(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Update machine
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid machine id' });
    const updates = { ...req.body };
    const machine = await Machine.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });
    res.json({ success: true, message: 'Machine updated', data: machine });
  } catch (err) {
    logger.error('Update machine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete machine (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid machine id' });
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });
    res.json({ success: true, message: 'Machine deleted' });
  } catch (err) {
    logger.error('Delete machine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
