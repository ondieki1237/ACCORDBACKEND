import express from 'express';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

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

    res.status(201).json({ success: true, message: 'Sale recorded successfully.', data: sale });
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

// @route   GET /api/sales/summary
// @desc    Get current user's sales summary (goal, sales made, and current sales)
// @access  Private
router.get('/summary', authenticate, async (req, res) => {
  try {
    // Fetch all sales for the current user
    const sales = await Sale.find({ userId: req.user._id });

    // Calculate total sales made (sum of price)
    const totalSales = sales.reduce((sum, sale) => sum + sale.price, 0);

    // Calculate the user's goal (sum of targets)
    const totalTarget = sales.reduce((sum, sale) => sum + sale.target, 0);

    res.json({
      success: true,
      data: {
        sales,         // All sales records for the user
        totalSales,    // Total sales value
        totalTarget    // Total target value
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales summary.' });
  }
});

// @route   POST /api/sales/target
// @desc    Admin sets or updates a user's sales target (without recording a sale)
// @access  Private (Admin only)
router.post('/target', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, target } = req.body;

    if (!userId || typeof target !== 'number') {
      return res.status(400).json({ success: false, message: 'userId and target are required.' });
    }

    // Optionally, check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // You can store the target in the User model, or create a new Sale with only target
    // Here, let's store it in the User model as "currentTarget"
    user.currentTarget = target;
    await user.save();

    res.status(200).json({ success: true, message: 'Target set successfully.', data: { userId, target } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set target.' });
  }
});

// @route   GET /api/sales
// @desc    Get all sales (admin only)
// @access  Private (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const allSales = await Sale.find({})
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: allSales });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch all sales.' });
  }
});

export default router;