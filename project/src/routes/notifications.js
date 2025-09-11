import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    // Dummy data
    res.json({ success: true, data: [{ _id: '1', message: 'Welcome!', read: false }] });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
});

// @route   POST /api/notifications/mark-read/:id
// @desc    Mark notification as read
// @access  Private
router.post('/mark-read/:id', authenticate, async (req, res) => {
  try {
    // Dummy logic
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

export default router;
