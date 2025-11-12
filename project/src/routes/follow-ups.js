import express from 'express';
import FollowUp from '../models/FollowUp.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/follow-ups
// @desc    Create a new follow-up
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      visitId, 
      date, 
      contactPerson, 
      outcome, 
      winningPoint, 
      progressExplanation, 
      improvements,
      failureReasons,
      downsides,
      notes 
    } = req.body;

    // Basic validation
    if (!visitId || !date || !contactPerson || !outcome) {
      return res.status(400).json({ 
        success: false, 
        message: 'visitId, date, contactPerson, and outcome are required.' 
      });
    }

    if (!contactPerson.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'contactPerson.name is required.' 
      });
    }

    // Outcome-specific validation
    if (outcome === 'deal_sealed' && !winningPoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'winningPoint is required when deal is sealed.' 
      });
    }

    if (outcome === 'in_progress' && !progressExplanation) {
      return res.status(400).json({ 
        success: false, 
        message: 'progressExplanation is required when deal is in progress.' 
      });
    }

    if (outcome === 'deal_failed' && !failureReasons) {
      return res.status(400).json({ 
        success: false, 
        message: 'failureReasons is required when deal failed.' 
      });
    }

    const followUp = new FollowUp({
      visitId,
      date: new Date(date),
      contactPerson: {
        name: contactPerson.name,
        role: contactPerson.role || '',
        phone: contactPerson.phone || '',
        email: contactPerson.email || ''
      },
      outcome,
      winningPoint: outcome === 'deal_sealed' ? winningPoint : undefined,
      progressExplanation: outcome === 'in_progress' ? progressExplanation : undefined,
      improvements: outcome === 'in_progress' ? improvements : undefined,
      failureReasons: outcome === 'deal_failed' ? failureReasons : undefined,
      downsides: outcome === 'deal_failed' ? downsides : undefined,
      notes,
      createdBy: req.user._id
    });

    await followUp.save();

    // Populate references
    await followUp.populate('visitId', 'client.name client.location visitPurpose date');
    await followUp.populate('createdBy', 'firstName lastName email');

    res.status(201).json({ 
      success: true, 
      message: 'Follow-up created successfully.', 
      data: followUp 
    });
  } catch (err) {
    console.error('Create follow-up error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create follow-up.', 
      error: err.message 
    });
  }
});

// @route   GET /api/follow-ups
// @desc    Get all follow-ups for the current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { visitId, outcome } = req.query;
    
    const query = { createdBy: req.user._id };
    if (visitId) query.visitId = visitId;
    if (outcome) query.outcome = outcome;

    const followUps = await FollowUp.find(query)
      .populate('visitId', 'client.name client.location visitPurpose date')
      .populate('createdBy', 'firstName lastName email')
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, data: followUps });
  } catch (err) {
    console.error('Fetch follow-ups error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch follow-ups.' });
  }
});

// @route   GET /api/follow-ups/visit/:visitId
// @desc    Get all follow-ups for a specific visit
// @access  Private
router.get('/visit/:visitId', authenticate, async (req, res) => {
  try {
    const followUps = await FollowUp.find({ visitId: req.params.visitId })
      .populate('visitId', 'client.name client.location visitPurpose date')
      .populate('createdBy', 'firstName lastName email')
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, data: followUps });
  } catch (err) {
    console.error('Fetch visit follow-ups error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch visit follow-ups.' });
  }
});

// @route   GET /api/follow-ups/admin
// @desc    Get all follow-ups (admin view)
// @access  Private (Admin/Manager)
router.get('/admin', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { visitId, outcome, userId, startDate, endDate } = req.query;
    
    const query = {};
    if (visitId) query.visitId = visitId;
    if (outcome) query.outcome = outcome;
    if (userId) query.createdBy = userId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const followUps = await FollowUp.find(query)
      .populate('visitId', 'client.name client.location client.type visitPurpose date')
      .populate('createdBy', 'firstName lastName email employeeId region')
      .sort({ date: -1, createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: followUps.length,
      byOutcome: {
        deal_sealed: followUps.filter(f => f.outcome === 'deal_sealed').length,
        in_progress: followUps.filter(f => f.outcome === 'in_progress').length,
        deal_failed: followUps.filter(f => f.outcome === 'deal_failed').length
      }
    };

    res.json({ 
      success: true, 
      data: followUps,
      stats 
    });
  } catch (err) {
    console.error('Admin fetch follow-ups error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch follow-ups.' });
  }
});

// @route   GET /api/follow-ups/:id
// @desc    Get single follow-up
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id)
      .populate('visitId', 'client.name client.location client.type visitPurpose date')
      .populate('createdBy', 'firstName lastName email employeeId');

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    // Check access: owner or admin/manager
    const isOwner = followUp.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: followUp });
  } catch (err) {
    console.error('Fetch follow-up error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch follow-up.' });
  }
});

// @route   PUT /api/follow-ups/:id
// @desc    Update a follow-up
// @access  Private (owner only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    // Check ownership
    if (followUp.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { 
      date, 
      contactPerson, 
      outcome, 
      winningPoint, 
      progressExplanation, 
      improvements,
      failureReasons,
      downsides,
      notes 
    } = req.body;

    // Update fields
    if (date) followUp.date = new Date(date);
    if (contactPerson) followUp.contactPerson = contactPerson;
    if (outcome) followUp.outcome = outcome;
    if (winningPoint !== undefined) followUp.winningPoint = winningPoint;
    if (progressExplanation !== undefined) followUp.progressExplanation = progressExplanation;
    if (improvements !== undefined) followUp.improvements = improvements;
    if (failureReasons !== undefined) followUp.failureReasons = failureReasons;
    if (downsides !== undefined) followUp.downsides = downsides;
    if (notes !== undefined) followUp.notes = notes;

    await followUp.save();

    await followUp.populate('visitId', 'client.name client.location visitPurpose date');
    await followUp.populate('createdBy', 'firstName lastName email');

    res.json({ success: true, message: 'Follow-up updated successfully.', data: followUp });
  } catch (err) {
    console.error('Update follow-up error:', err);
    res.status(500).json({ success: false, message: 'Failed to update follow-up.' });
  }
});

// @route   DELETE /api/follow-ups/:id
// @desc    Delete a follow-up
// @access  Private (owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    // Check ownership or admin
    const isOwner = followUp.createdBy.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await followUp.deleteOne();

    res.json({ success: true, message: 'Follow-up deleted successfully.' });
  } catch (err) {
    console.error('Delete follow-up error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete follow-up.' });
  }
});

export default router;