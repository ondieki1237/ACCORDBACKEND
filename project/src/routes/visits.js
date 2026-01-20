import express from 'express';
import mongoose from 'mongoose';
import Visit from '../models/Visit.js';
import Facility from '../../src/models/Facility.js';
import Machine from '../../src/models/Machine.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateVisit, validatePagination, validateDateRange } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   POST /api/visits
// @desc    Create new visit
// @access  Private
router.post('/', authenticate, validateVisit, async (req, res) => {
  try {
    const visitData = {
      ...req.body,
      userId: req.user._id
    };

    // Auto-generate visitId if not provided
    if (!visitData.visitId) {
      // Example: VISIT + timestamp + random 3 digits
      visitData.visitId = `VISIT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }

    // Calculate visit duration if endTime is provided
    if (visitData.startTime && visitData.endTime) {
      const start = new Date(visitData.startTime);
      const end = new Date(visitData.endTime);
      visitData.duration = Math.round((end - start) / (1000 * 60)); // minutes
    }

    // Calculate total potential value from requested equipment
    if (visitData.requestedEquipment && visitData.requestedEquipment.length > 0) {
      visitData.totalPotentialValue = visitData.requestedEquipment.reduce((total, item) => {
        return total + (item.estimatedBudget || 0) * (item.quantity || 1);
      }, 0);
    }

    const visit = new Visit(visitData);
    await visit.save();

    // Populate user information
    await visit.populate('userId', 'firstName lastName employeeId region');

    // Emit real-time update to admin dashboard
    req.app.get('io').emit('visitUpdate', {
      userId: req.user._id,
      visitId: visit._id,
      client: visit.client,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Visit recorded successfully',
      data: visit
    });
  } catch (error) {
    // Log full error for debugging
    logger.error('Visit creation error:', error && error.stack ? error.stack : error);

    // If validation error from mongoose, return details
    if (error && error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Return error.message to help frontend debug (kept concise)
    res.status(500).json({
      success: false,
      message: 'Failed to record visit',
      error: error && error.message ? error.message : 'Unknown error'
    });
  }
});

// @route   GET /api/visits
// @desc    Get visits (with filters)
// @access  Private
router.get('/', authenticate, validatePagination, validateDateRange, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      userId,
      clientType,
      visitOutcome,
      region,
      search
    } = req.query;

    // Build query
    const query = {};

    // Role-based access
    if (req.user.role === 'sales') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Other filters
    if (clientType) query['client.type'] = clientType;
    if (visitOutcome) query.visitOutcome = visitOutcome;

    // Search functionality
    if (search) {
      query.$or = [
        { 'client.name': { $regex: search, $options: 'i' } },
        { 'contacts.name': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
      populate: {
        path: 'userId',
        select: 'firstName lastName employeeId region'
      }
    };

    const visits = await Visit.paginate(query, options);

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    logger.error('Get visits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visits'
    });
  }
});

// @route   GET /api/visits/:id
// @desc    Get single visit
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('userId', 'firstName lastName employeeId region')
      .populate('followUpActions.assignedTo', 'firstName lastName employeeId');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Check permission
    if (req.user.role === 'sales' && visit.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    logger.error('Get visit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visit'
    });
  }
});

// @route   PUT /api/visits/:id
// @desc    Update visit
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Check permission (owners allowed to update their own visits)
    if (req.user.role === 'sales' && String(visit.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Recalculate duration if times are updated
    const updateData = { ...req.body };
    if (updateData.startTime && updateData.endTime) {
      const start = new Date(updateData.startTime);
      const end = new Date(updateData.endTime);
      updateData.duration = Math.round((end - start) / (1000 * 60));
    }

    // Recalculate total potential value
    if (updateData.requestedEquipment) {
      updateData.totalPotentialValue = updateData.requestedEquipment.reduce((total, item) => {
        return total + (item.estimatedBudget || 0) * (item.quantity || 1);
      }, 0);
    }

    const updatedVisit = await Visit.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName employeeId region');

    res.json({
      success: true,
      message: 'Visit updated successfully',
      data: updatedVisit
    });
  } catch (error) {
    logger.error('Update visit error:', error);

    // Provide validation details when available to help frontend debug
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update visit',
      error: error.message
    });
  }
});

// @route   DELETE /api/visits/:id
// @desc    Delete visit
// @access  Private (Admin/Manager or owner)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Permission check: admin/manager can delete any; sales can delete their own visits
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && visit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Visit.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Visit deleted successfully'
    });
  } catch (error) {
    logger.error('Delete visit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete visit'
    });
  }
});

// @route   POST /api/visits/:id/follow-up
// @desc    Add follow-up action to visit
// @access  Private
router.post('/:id/follow-up', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { action, assignedTo, dueDate, priority } = req.body;

    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    visit.followUpActions.push({
      action,
      assignedTo: assignedTo || req.user._id,
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      status: 'pending'
    });

    visit.isFollowUpRequired = true;
    await visit.save();

    res.json({
      success: true,
      message: 'Follow-up action added successfully',
      data: visit
    });
  } catch (error) {
    logger.error('Add follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add follow-up action'
    });
  }
});

// @route   GET /api/visits/analytics/summary
// @desc    Get visits analytics summary
// @access  Private
router.get('/analytics/summary', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

  if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);

    const summary = await Visit.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          successfulVisits: {
            $sum: { $cond: [{ $eq: ['$visitOutcome', 'successful'] }, 1, 0] }
          },
          totalContacts: { $sum: { $size: '$contacts' } },
          totalPotentialValue: { $sum: '$totalPotentialValue' },
          averageDuration: { $avg: '$duration' },
          clientTypes: {
            $push: '$client.type'
          }
        }
      },
      {
        $addFields: {
          successRate: {
            $multiply: [
              { $divide: ['$successfulVisits', '$totalVisits'] },
              100
            ]
          }
        }
      }
    ]);

    // Get client type distribution
    const clientTypeDistribution = await Visit.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$client.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalVisits: 0,
          successfulVisits: 0,
          totalContacts: 0,
          totalPotentialValue: 0,
          averageDuration: 0,
          successRate: 0
        },
        clientTypeDistribution
      }
    });
  } catch (error) {
    logger.error('Visit analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    });
  }
});

// @route   GET /api/visits/:id/contacts-mapped
// @desc    Get single visit and map contacts, facility info and possible machine matches
// @access  Private
router.get('/:id/contacts-mapped', authenticate, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id).lean();
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Permission check: sales users may only fetch their own visits
    if (req.user.role === 'sales' && visit.userId && visit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Attempt to resolve facility by exact name, then by text-search fallback
    let facility = null;
    const clientName = visit.client && visit.client.name;
    if (clientName) {
      facility = await Facility.findOne({ 'properties.name': clientName }).lean();
      if (!facility) {
        facility = await Facility.findOne({ $text: { $search: clientName } }).lean();
      }
    }

    // For each productOfInterest try to find a matching machine record
    const mappedProducts = [];
    if (Array.isArray(visit.productsOfInterest)) {
      for (const p of visit.productsOfInterest) {
        const name = p && p.name ? p.name : '';
        let matched = null;
        if (name) {
          // Try text search first (requires machine text index), then fallback to regex on model/manufacturer
          try {
            matched = await Machine.findOne({ $text: { $search: name } }).lean();
          } catch (e) {
            matched = null;
          }

          if (!matched) {
            const regex = new RegExp(name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
            matched = await Machine.findOne({ $or: [{ model: regex }, { manufacturer: regex }, { 'facility.name': regex }] }).lean();
          }
        }

        mappedProducts.push({ product: p, matchedMachine: matched || null });
      }
    }

    const payload = {
      visitId: visit._id,
      visitRef: visit.visitId || null,
      date: visit.date,
      startTime: visit.startTime,
      endTime: visit.endTime,
      duration: visit.duration,
      client: visit.client || null,
      facility: facility || null,
      contacts: visit.contacts || [],
      productsOfInterest: mappedProducts,
      existingEquipment: visit.existingEquipment || [],
      notes: visit.notes || null
    };

    return res.json({ success: true, data: payload });
  } catch (error) {
    logger.error('Get visit contacts-mapped error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve mapped visit data' });
  }
});

export default router;