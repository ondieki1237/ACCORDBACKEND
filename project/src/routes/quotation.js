import express from 'express';
import Request from '../models/Request.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendQuotationResponseEmail } from '../utils/email.js';
import { sendEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   POST /api/quotation
// @desc    Submit a quotation request
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { hospital, location, equipmentRequired, urgency, contactName, contactEmail, contactPhone } = req.body;

    if (!hospital || !location || !equipmentRequired || !urgency || !contactName || !contactPhone) {
      return res.status(400).json({ success: false, message: 'Required fields: hospital, location, equipmentRequired, urgency, contactName, contactPhone' });
    }

    if (!['low', 'medium', 'high'].includes(urgency)) {
      return res.status(400).json({ success: false, message: 'Invalid urgency level. Must be: low, medium, or high' });
    }

    const request = new Request({
      hospital,
      location,
      equipmentRequired,
      urgency,
      contactName,
      contactEmail: contactEmail || '',
      contactPhone,
      userId: req.user._id,
      status: 'pending',
      responded: false
    });

    await request.save();

    // Send notification to admin and notification emails
    const notificationEmails = [];
    if (process.env.ADMIN_EMAIL) {
      notificationEmails.push(process.env.ADMIN_EMAIL);
    }
    if (process.env.HR_EMAIL) {
      notificationEmails.push(process.env.HR_EMAIL);
    }
    if (process.env.NOTIFICATION_EMAILS) {
      const additionalEmails = process.env.NOTIFICATION_EMAILS.split(',').map(e => e.trim());
      notificationEmails.push(...additionalEmails);
    }

    if (notificationEmails.length > 0) {
      try {
        // Remove duplicates
        const uniqueEmails = [...new Set(notificationEmails)];
        
        await sendEmail({
          to: uniqueEmails.join(','),
          subject: `New Quotation Request - ${hospital} (${urgency} priority)`,
          template: 'newQuotation',
          data: {
            hospital,
            location,
            equipmentRequired,
            urgency,
            contactName,
            contactPhone,
            requesterName: `${req.user.firstName} ${req.user.lastName}`,
            quotationUrl: `${process.env.APP_URL || 'http://localhost:5000'}/admin/quotations/${request._id}`
          }
        });
      } catch (emailError) {
        logger.error('Failed to send quotation notification email:', emailError);
        // Don't fail the API if email fails
      }
    }

    res.status(201).json({ 
      success: true, 
      message: 'Quotation request submitted successfully.',
      data: request
    });
  } catch (err) {
    logger.error('Quotation submission error:', err);
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

// @route   GET /api/quotation/my/responded
// @desc    Get quotations submitted by the current user that have been responded to
// @access  Private
router.get('/my/responded', authenticate, async (req, res) => {
  try {
    const respondedQuotations = await Request.find({ userId: req.user._id, status: 'responded' })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email');

    res.json({ success: true, data: respondedQuotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch responded quotations.' });
  }
});

// @route   GET /api/quotation/all
// @desc    Get all quotations (admin only)
// @access  Private (Admin)
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const allQuotations = await Request.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: allQuotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch all quotations.' });
  }
});

// @route   POST /api/quotation/respond/:id
// @desc    Admin responds to a quotation request
// @access  Private (Admin)
router.post('/respond/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { isAvailable, price, availableDate, notes } = req.body;
    const { id } = req.params;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Quotation request not found.' });
    }

    request.response = {
      isAvailable,
      price,
      availableDate,
      notes,
      respondedAt: new Date(),
      responder: req.user._id // Track who responded
    };
    request.status = 'responded';

    await request.save();

    // Send email notification to requester
    try {
      await sendQuotationResponseEmail({
        to: request.contactEmail,
        hospital: request.hospital,
        equipment: request.equipmentRequired,
        isAvailable,
        price,
        availableDate,
        notes
      });
    } catch (emailErr) {
      // Log but don't fail the API if email fails
      console.error('Failed to send quotation response email:', emailErr);
    }

    res.json({ success: true, message: 'Response submitted successfully.', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to respond to quotation request.' });
  }
});

export default router;