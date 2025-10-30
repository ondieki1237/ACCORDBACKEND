import express from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../../middleware/auth.js';
import Request from '../../models/Request.js';
import { sendQuotationResponseEmail } from '../../utils/email.js';
import { sendEmail } from '../../services/emailService.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// @route   GET /api/admin/quotations
// @desc    Get all quotations with filtering and pagination (Admin)
// @access  Private (Admin/Manager)
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      urgency,
      userId,
      responded,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (userId) query.userId = userId;
    if (responded !== undefined) query.responded = responded === 'true';
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { hospital: { $regex: search, $options: 'i' } },
        { equipmentRequired: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'userId',
          select: 'firstName lastName email phone employeeId'
        },
        {
          path: 'response.respondedBy',
          select: 'firstName lastName email'
        }
      ]
    };

    const quotations = await Request.paginate(query, options);

    res.json({
      success: true,
      data: quotations
    });

  } catch (error) {
    logger.error('Fetch admin quotations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations'
    });
  }
});

// @route   GET /api/admin/quotations/:id
// @desc    Get single quotation by ID (Admin)
// @access  Private (Admin/Manager)
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const quotation = await Request.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone employeeId')
      .populate('response.respondedBy', 'firstName lastName email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      data: quotation
    });

  } catch (error) {
    logger.error('Fetch quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation'
    });
  }
});

// @route   PUT /api/admin/quotations/:id/respond
// @desc    Respond to a quotation request (Admin)
// @access  Private (Admin/Manager)
router.put('/:id/respond', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { 
      response, 
      quotationDocument, 
      estimatedCost,
      isAvailable,
      price,
      availableDate,
      notes
    } = req.body;

    const quotation = await Request.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Update quotation with response
    quotation.responded = true;
    quotation.status = 'responded';
    quotation.response = {
      message: response || notes,
      documentUrl: quotationDocument,
      estimatedCost: estimatedCost || price,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      price,
      availableDate: availableDate ? new Date(availableDate) : undefined,
      notes,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    await quotation.save();

    // Send notification email to the sales rep who created the request
    try {
      if (quotation.userId && quotation.userId.email) {
        await sendEmail({
          to: quotation.userId.email,
          subject: `Quotation Response - ${quotation.hospital}`,
          template: 'quotationResponse',
          data: {
            firstName: quotation.userId.firstName,
            hospital: quotation.hospital,
            equipment: quotation.equipmentRequired,
            response: quotation.response.message || quotation.response.notes,
            estimatedCost: quotation.response.estimatedCost,
            documentUrl: quotation.response.documentUrl
          }
        });
      }

      // Also send to client if email provided
      if (quotation.contactEmail) {
        await sendQuotationResponseEmail({
          to: quotation.contactEmail,
          hospital: quotation.hospital,
          equipment: quotation.equipmentRequired,
          isAvailable: quotation.response.isAvailable,
          price: quotation.response.price,
          availableDate: quotation.response.availableDate,
          notes: quotation.response.notes
        });
      }

      // Notify HR and notification emails
      const notificationEmails = process.env.NOTIFICATION_EMAILS ? 
        process.env.NOTIFICATION_EMAILS.split(',').map(e => e.trim()) : [];
      if (process.env.HR_EMAIL) {
        notificationEmails.push(process.env.HR_EMAIL);
      }

      if (notificationEmails.length > 0) {
        await sendEmail({
          to: notificationEmails.join(','),
          subject: `Quotation Responded - ${quotation.hospital}`,
          template: 'quotationResponse',
          data: {
            firstName: 'Admin',
            hospital: quotation.hospital,
            equipment: quotation.equipmentRequired,
            response: quotation.response.message || quotation.response.notes,
            estimatedCost: quotation.response.estimatedCost,
            documentUrl: quotation.response.documentUrl
          }
        });
      }
    } catch (emailError) {
      logger.error('Failed to send quotation response email:', emailError);
      // Don't fail the API if email fails
    }

    // Populate for response
    await quotation.populate('response.respondedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: quotation
    });

  } catch (error) {
    logger.error('Respond to quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to quotation'
    });
  }
});

// @route   PUT /api/admin/quotations/:id
// @desc    Update quotation status (Admin)
// @access  Private (Admin/Manager)
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;

    if (status && !['pending', 'in_progress', 'responded', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const quotation = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate('userId', 'firstName lastName email phone employeeId')
      .populate('response.respondedBy', 'firstName lastName email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });

  } catch (error) {
    logger.error('Update quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quotation'
    });
  }
});

// @route   GET /api/admin/quotations/stats/summary
// @desc    Get quotations statistics (Admin)
// @access  Private (Admin/Manager)
router.get('/stats/summary', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);

    const stats = await Request.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalQuotations: { $sum: 1 },
          pendingQuotations: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressQuotations: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          respondedQuotations: {
            $sum: { $cond: [{ $eq: ['$status', 'responded'] }, 1, 0] }
          },
          completedQuotations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          rejectedQuotations: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          highUrgency: {
            $sum: { $cond: [{ $eq: ['$urgency', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get urgency distribution
    const urgencyDistribution = await Request.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$urgency',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalQuotations: 0,
          pendingQuotations: 0,
          inProgressQuotations: 0,
          respondedQuotations: 0,
          completedQuotations: 0,
          rejectedQuotations: 0,
          highUrgency: 0
        },
        urgencyDistribution
      }
    });

  } catch (error) {
    logger.error('Quotations stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
