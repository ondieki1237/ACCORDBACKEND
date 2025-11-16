import express from 'express';
import mongoose from 'mongoose';
import Machine from '../models/Machine.js';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getServicesByMachine } from '../controllers/engineeringServiceController.js';

const router = express.Router();

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
