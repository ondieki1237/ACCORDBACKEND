import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import Report from '../../models/Report.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// @route   GET /api/admin/reports
// @desc    Get all reports with filtering and pagination (Admin)
// @access  Private (Admin/Manager)
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.weekStart = {};
      if (startDate) query.weekStart.$gte = new Date(startDate);
      if (endDate) query.weekStart.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'userId reviewedBy',
        select: 'firstName lastName email phone employeeId'
      }
    };

    const reports = await Report.paginate(query, options);

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    logger.error('Fetch admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// @route   GET /api/admin/reports/:id
// @desc    Get single report by ID (Admin)
// @access  Private (Admin/Manager)
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone employeeId')
      .populate('reviewedBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Fetch report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report'
    });
  }
});

// @route   PUT /api/admin/reports/:id
// @desc    Update report status and add admin notes (Admin)
// @access  Private (Admin/Manager)
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (status && !['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, reviewed, approved, or rejected'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    updateData.reviewedBy = req.user._id;
    updateData.reviewedAt = new Date();

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('userId', 'firstName lastName email phone employeeId')
      .populate('reviewedBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });

  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report'
    });
  }
});

// @route   GET /api/admin/reports/stats/summary
// @desc    Get reports statistics (Admin)
// @access  Private (Admin/Manager)
router.get('/stats/summary', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.weekStart = {};
      if (startDate) matchStage.weekStart.$gte = new Date(startDate);
      if (endDate) matchStage.weekStart.$lte = new Date(endDate);
    }

    if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);

    const stats = await Report.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          reviewedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] }
          },
          approvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          draftReports: {
            $sum: { $cond: [{ $eq: ['$isDraft', true] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalReports: 0,
        pendingReports: 0,
        reviewedReports: 0,
        approvedReports: 0,
        rejectedReports: 0,
        draftReports: 0
      }
    });

  } catch (error) {
    logger.error('Reports stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
