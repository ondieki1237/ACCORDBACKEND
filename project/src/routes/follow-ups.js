import express from 'express';
import FollowUp from '../models/FollowUp.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/follow-ups
// @desc    Create a new follow-up
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { visitId, action, assignedTo, dueDate, priority } = req.body;

    if (!visitId || !action || !assignedTo || !dueDate) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const followUp = new FollowUp({
      visitId,
      action,
      assignedTo,
      dueDate,
      priority,
      createdBy: req.user._id
    });

    await followUp.save();

    res.status(201).json({ success: true, message: 'Follow-up created successfully.', data: followUp });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create follow-up.' });
  }
});

// @route   GET /api/follow-ups
// @desc    Get all follow-ups for the current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const followUps = await FollowUp.find({ createdBy: req.user._id })
      .populate('visitId', 'hospital location')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: followUps });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch follow-ups.' });
  }
});

// @route   PUT /api/follow-ups/:id
// @desc    Update a follow-up (e.g., mark as completed)
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const followUp = await FollowUp.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    res.json({ success: true, message: 'Follow-up updated successfully.', data: followUp });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update follow-up.' });
  }
});

export default router;