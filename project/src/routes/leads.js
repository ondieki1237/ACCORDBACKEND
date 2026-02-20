import express from 'express';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// DEBUG ONLY: Create test leads for current user (remove in production)
router.post('/seed-test', authenticate, async (req, res) => {
  try {
    const testLeads = [];
    for (let i = 1; i <= 10; i++) {
      testLeads.push({
        facilityName: `Test Facility ${i}`,
        facilityType: 'hospital',
        location: 'Nairobi',
        contactPerson: {
          name: `Contact ${i}`,
          phone: `+25471234567${i}`
        },
        hospitalLevel: 'Level 5',
        equipmentName: `Equipment ${i}`,
        budget: '1000000',
        expectedPurchaseDate: new Date(),
        competitorAnalysis: '',
        leadStatus: 'new',
        leadSource: 'field-visit',
        createdBy: req.user._id
      });
    }
    
    const result = await Lead.insertMany(testLeads);
    logger.info('Created test leads for user', { userId: req.user._id, count: result.length });
    res.json({ success: true, message: `Created ${result.length} test leads`, data: { count: result.length } });
  } catch (error) {
    logger.error('Seed test leads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new lead
router.post('/', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };

    // Basic validation
    if (!data.facilityName) return res.status(400).json({ success: false, error: 'facilityName is required' });
    if (!data.contactPerson || !data.contactPerson.name) return res.status(400).json({ success: false, error: 'contactPerson.name is required' });
    if (!data.contactPerson.phone) return res.status(400).json({ success: false, error: 'contactPerson.phone is required' });
    if (!data.equipmentName) return res.status(400).json({ success: false, error: 'equipmentName is required' });

    const lead = new Lead(data);
    await lead.save();

    res.status(201).json({ success: true, message: 'Lead created successfully', data: lead });
  } catch (error) {
    logger.error('Create lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leads for current user (paginated)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, facilityType, leadStatus, urgency, startDate, endDate, search } = req.query;

    const query = { createdBy: req.user._id };
    if (facilityType) query.facilityType = facilityType;
    if (leadStatus) query.leadStatus = leadStatus;
    if (urgency) query['timeline.urgency'] = urgency;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    // Debug logging
    logger.info('GET /api/leads - User requesting leads', { 
      userId: req.user._id.toString(), 
      userEmail: req.user.email,
      userRole: req.user.role,
      query,
      page,
      limit 
    });

    const results = await Lead.paginate(query, options);
    
    logger.info('GET /api/leads - Query results', {
      totalDocs: results.totalDocs,
      docsReturned: results.docs.length,
      page: results.page,
      totalPages: results.totalPages
    });

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Get leads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single lead (owner or admin)
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid lead id' });
    }

    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const isOwner = lead.createdBy.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Access denied' });

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Get lead by id error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update lead (owner or admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid lead id' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const isOwner = lead.createdBy.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Access denied' });

    // If leadStatus is being updated, record the transition in statusHistory
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
    logger.error('Update lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete lead (owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid lead id' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const isOwner = lead.createdBy.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Access denied' });

    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    logger.error('Delete lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
