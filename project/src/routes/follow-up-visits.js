import express from 'express';
import FollowUpVisit from '../models/FollowUpVisit.js';
import Visit from '../models/Visit.js';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Create follow-up visit
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      followUpDate,
      reason,
      outcome,
      needAnotherFollowUp,
      whyAnotherFollowUp,
      whyNoMoreFollowUp,
      visitId
    } = req.body;

    // Basic required checks
    if (!visitId || !followUpDate || !reason || !outcome || needAnotherFollowUp === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate visit existence
    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

    // Conditional validations
    if (needAnotherFollowUp && (!whyAnotherFollowUp || whyAnotherFollowUp.toString().trim().length < 10)) {
      return res.status(400).json({ success: false, message: 'whyAnotherFollowUp is required and must be at least 10 characters' });
    }
    if (!needAnotherFollowUp && (!whyNoMoreFollowUp || whyNoMoreFollowUp.toString().trim().length < 10)) {
      return res.status(400).json({ success: false, message: 'whyNoMoreFollowUp is required and must be at least 10 characters' });
    }

    const followUp = new FollowUpVisit({
      userId: req.user._id,
      visitId,
      followUpDate: new Date(followUpDate),
      reason,
      outcome,
      needAnotherFollowUp,
      whyAnotherFollowUp: needAnotherFollowUp ? whyAnotherFollowUp : undefined,
      whyNoMoreFollowUp: needAnotherFollowUp ? undefined : whyNoMoreFollowUp
    });

    await followUp.save();

    // Attach reference to visit
    try {
      visit.followUpVisits = visit.followUpVisits || [];
      visit.followUpVisits.push(followUp._id);
      // Update isFollowUpRequired flag based on the new follow-up
      visit.isFollowUpRequired = !!needAnotherFollowUp;
      await visit.save();
    } catch (e) {
      logger.error('Failed to attach follow-up to visit:', e);
    }

    await followUp.populate('userId', 'firstName lastName email');
    await followUp.populate('visitId', 'client.name client.location date visitPurpose');

    res.status(201).json({ success: true, message: 'Follow-up visit recorded successfully', data: followUp });
  } catch (error) {
    logger.error('Create follow-up visit error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(error.errors).map(e => e.message) });
    }
    res.status(500).json({ success: false, message: 'Failed to create follow-up visit', error: error.message });
  }
});

// Get follow-up visits (user or admin)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, needAnotherFollowUp, startDate, endDate, userId } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    if (needAnotherFollowUp !== undefined) query.needAnotherFollowUp = needAnotherFollowUp === 'true';
    if (startDate || endDate) {
      query.followUpDate = {};
      if (startDate) query.followUpDate.$gte = new Date(startDate);
      if (endDate) query.followUpDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [visits, total] = await Promise.all([
      FollowUpVisit.find(query)
        .populate('userId', 'firstName lastName email')
        .populate('visitId', 'client.name client.location visitPurpose date')
        .sort({ followUpDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FollowUpVisit.countDocuments(query)
    ]);

    res.json({ success: true, data: visits, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    logger.error('Get follow-up visits error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch follow-up visits' });
  }
});

// Get single follow-up
router.get('/:id', authenticate, async (req, res) => {
  try {
    const followUp = await FollowUpVisit.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('visitId', 'client.name client.location visitPurpose date');

    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up visit not found' });

    if (req.user.role !== 'admin' && followUp.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: followUp });
  } catch (error) {
    logger.error('Get follow-up visit error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch follow-up visit' });
  }
});

// Update follow-up visit
router.put('/:id', authenticate, async (req, res) => {
  try {
    const followUp = await FollowUpVisit.findById(req.params.id);
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up visit not found' });

    if (req.user.role !== 'admin' && followUp.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this follow-up visit' });
    }

    const updateData = req.body;

    // If updating needAnotherFollowUp, ensure conditional fields
    if (updateData.needAnotherFollowUp !== undefined) {
      if (updateData.needAnotherFollowUp && (!updateData.whyAnotherFollowUp || updateData.whyAnotherFollowUp.toString().trim().length < 10)) {
        return res.status(400).json({ success: false, message: 'whyAnotherFollowUp is required and must be at least 10 characters' });
      }
      if (!updateData.needAnotherFollowUp && (!updateData.whyNoMoreFollowUp || updateData.whyNoMoreFollowUp.toString().trim().length < 10)) {
        return res.status(400).json({ success: false, message: 'whyNoMoreFollowUp is required and must be at least 10 characters' });
      }
    }

    Object.assign(followUp, updateData);
    await followUp.save();

    // Reflect on visit record if needAnotherFollowUp changed
    if (updateData.needAnotherFollowUp !== undefined) {
      try {
        const visit = await Visit.findById(followUp.visitId);
        if (visit) {
          visit.isFollowUpRequired = !!followUp.needAnotherFollowUp;
          await visit.save();
        }
      } catch (e) {
        logger.error('Failed to sync visit follow-up flag:', e);
      }
    }

    await followUp.populate('userId', 'firstName lastName email');
    await followUp.populate('visitId', 'client.name client.location visitPurpose date');

    res.json({ success: true, message: 'Follow-up visit updated successfully', data: followUp });
  } catch (error) {
    logger.error('Update follow-up visit error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(error.errors).map(e => e.message) });
    }
    res.status(500).json({ success: false, message: 'Failed to update follow-up visit' });
  }
});

// Delete follow-up visit
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const followUp = await FollowUpVisit.findById(req.params.id);
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up visit not found' });

    if (req.user.role !== 'admin' && followUp.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this follow-up visit' });
    }

    // Remove reference from visit
    try {
      const visit = await Visit.findById(followUp.visitId);
      if (visit && Array.isArray(visit.followUpVisits)) {
        visit.followUpVisits = visit.followUpVisits.filter(id => id.toString() !== followUp._id.toString());
        // Optionally update isFollowUpRequired: if no more followUpVisits with needAnotherFollowUp true, set false
        if (visit.followUpVisits.length === 0) visit.isFollowUpRequired = false;
        await visit.save();
      }
    } catch (e) {
      logger.error('Failed to remove follow-up reference from visit:', e);
    }

    await followUp.deleteOne();

    res.json({ success: true, message: 'Follow-up visit deleted successfully' });
  } catch (error) {
    logger.error('Delete follow-up visit error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete follow-up visit' });
  }
});

export default router;
