import express from 'express';
import mongoose from 'mongoose';
import Lead from '../../models/Lead.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Admin: list all leads with filters and pagination
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 20, facilityType, leadStatus, urgency, startDate, endDate, search } = req.query;
    const query = {};
    if (facilityType) query.facilityType = facilityType;
    if (leadStatus) query.leadStatus = leadStatus;
    if (urgency) query['timeline.urgency'] = urgency;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) query.$text = { $search: search };

    const options = { page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 } };
    const results = await Lead.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Admin get leads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: get single lead by id
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid lead id' });
    }

    const lead = await Lead.findById(req.params.id).populate('createdBy', 'firstName lastName email');
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Admin get lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: update lead status or any field
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid lead id' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    // Record status change history when admin updates leadStatus
    if (req.body.leadStatus && req.body.leadStatus !== lead.leadStatus) {
      lead.statusHistory = lead.statusHistory || [];
      lead.statusHistory.push({
        from: lead.leadStatus,
        to: req.body.leadStatus,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: req.body.statusChangeNote || undefined
      });
    }

    Object.assign(lead, req.body);
    await lead.save();

    res.json({ success: true, message: 'Lead updated successfully', data: lead });
  } catch (error) {
    logger.error('Admin update lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: delete lead
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid lead id' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    logger.error('Admin delete lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
