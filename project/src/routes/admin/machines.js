import express from 'express';
import mongoose from 'mongoose';
import Machine from '../../models/Machine.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import logger from '../../utils/logger.js';

const router = express.Router();

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

export default router;
