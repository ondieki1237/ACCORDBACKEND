import express from 'express';
import Request from '../models/Request.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/quotation
// @desc    Submit a quotation request
// @access  Public or Private (choose as needed)
router.post('/', authenticate, async (req, res) => {
  try {
    const { hospital, location, equipmentRequired, urgency, contactName, contactEmail, contactPhone } = req.body;

    if (!hospital || !location || !equipmentRequired || !urgency || !contactName || !contactEmail || !contactPhone) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const request = new Request({
      hospital,
      location,
      equipmentRequired,
      urgency,
      contactName,
      contactEmail,
      contactPhone,
      userId: req.user._id // <-- Save userId
    });

    await request.save();

    res.status(201).json({ success: true, message: 'Quotation request submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit quotation request.' });
  }
});

// @route   GET /api/quotation/my
// @desc    Get quotations submitted by the current user
// @access  Private
router.get('/my', authenticate, async (req, res) => {
  try {
    const myQuotations = await Request.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email'); // <-- Populate user info

    res.json({ success: true, data: myQuotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your quotations.' });
  }
});

export default router;