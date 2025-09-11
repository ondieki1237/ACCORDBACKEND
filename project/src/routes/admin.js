import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get admin stats
// @access  Private (admin only)
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Dummy data
    res.json({ success: true, data: { users: 100, visits: 200, orders: 50 } });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get admin stats' });
  }
});

export default router;
