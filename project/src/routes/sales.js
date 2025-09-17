import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/sales
// @desc    Admin posts a sale for a user
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, equipment, price, target } = req.body;

    if (!userId || !equipment || !price || !target) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Optionally, check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const sale = new Sale({
      userId,
      equipment,
      price,
      target
    });

    await sale.save();

    res.status(201).json({ success: true, message: 'Sale recorded successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record sale.' });
  }
});

// @route   GET /api/sales/my
// @desc    Get sales for the logged-in user
// @access  Private
router.get('/my', authenticate, async (req, res) => {
  try {
    const mySales = await Sale.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: mySales });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your sales.' });
  }
});

export default router;