import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import Report from '../../models/Report.js';
import Visit from '../../models/Visit.js';
import Request from '../../models/Request.js';
import Planner from '../../models/Planner.js';
import FollowUp from '../../models/FollowUp.js';
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
// @desc    Get single report with full details including visits and quotations data
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

    // Fetch all visits for this user within the report's week range
    const visits = await Visit.find({
      userId: report.userId._id,
      date: {
        $gte: report.weekStart,
        $lte: report.weekEnd
      }
    })
    .populate('userId', 'firstName lastName email employeeId')
    .populate('followUpActions.assignedTo', 'firstName lastName email')
    .sort({ date: 1 })
    .lean();

    // Fetch all quotation requests for this user within the report's week range
    const quotations = await Request.find({
      userId: report.userId._id,
      createdAt: {
        $gte: report.weekStart,
        $lte: report.weekEnd
      }
    })
    .populate('userId', 'firstName lastName email employeeId')
    .populate('response.respondedBy', 'firstName lastName email')
    .sort({ createdAt: 1 })
    .lean();

    // Calculate summary statistics
    const visitStats = {
      total: visits.length,
      byOutcome: {
        successful: visits.filter(v => v.visitOutcome === 'successful').length,
        pending: visits.filter(v => v.visitOutcome === 'pending').length,
        followup_required: visits.filter(v => v.visitOutcome === 'followup_required').length,
        no_interest: visits.filter(v => v.visitOutcome === 'no_interest').length
      },
      byPurpose: {
        demo: visits.filter(v => v.visitPurpose === 'demo').length,
        followup: visits.filter(v => v.visitPurpose === 'followup').length,
        installation: visits.filter(v => v.visitPurpose === 'installation').length,
        maintenance: visits.filter(v => v.visitPurpose === 'maintenance').length,
        consultation: visits.filter(v => v.visitPurpose === 'consultation').length,
        sales: visits.filter(v => v.visitPurpose === 'sales').length,
        other: visits.filter(v => v.visitPurpose === 'other').length
      },
      totalPotentialValue: visits.reduce((sum, v) => sum + (v.totalPotentialValue || 0), 0)
    };

    const quotationStats = {
      total: quotations.length,
      byStatus: {
        pending: quotations.filter(q => q.status === 'pending').length,
        in_progress: quotations.filter(q => q.status === 'in_progress').length,
        responded: quotations.filter(q => q.status === 'responded').length,
        completed: quotations.filter(q => q.status === 'completed').length,
        rejected: quotations.filter(q => q.status === 'rejected').length
      },
      byUrgency: {
        low: quotations.filter(q => q.urgency === 'low').length,
        medium: quotations.filter(q => q.urgency === 'medium').length,
        high: quotations.filter(q => q.urgency === 'high').length
      }
    };

    // Combine all data for frontend PDF generation
    const responseData = {
      report: report.toObject(),
      visits,
      quotations,
      // Planners created by the user in the same week (if any)
      planners: await Planner.find({
        userId: report.userId._id,
        weekCreatedAt: { $gte: report.weekStart, $lte: report.weekEnd }
      }).lean(),
      // Follow-ups created by the user in the same week
      followUps: await FollowUp.find({
        userId: report.userId._id,
        createdAt: { $gte: report.weekStart, $lte: report.weekEnd }
      }).lean(),
      statistics: {
        visits: visitStats,
        quotations: quotationStats
      },
      meta: {
        totalVisits: visits.length,
        totalQuotations: quotations.length,
        weekRange: report.weekRange,
        submittedAt: report.createdAt,
        salesRep: {
          name: `${report.userId.firstName} ${report.userId.lastName}`,
          email: report.userId.email,
          employeeId: report.userId.employeeId,
          phone: report.userId.phone
        }
      }
    };

    res.json({
      success: true,
      data: responseData
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

// @route   POST /api/admin/reports/bulk
// @desc    Get multiple reports with full details (for bulk PDF generation)
// @access  Private (Admin/Manager)
router.post('/bulk', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { reportIds } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'reportIds array is required'
      });
    }

    // Limit to 50 reports at a time to prevent overload
    if (reportIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 reports can be fetched at once'
      });
    }

    const reports = await Report.find({ _id: { $in: reportIds } })
      .populate('userId', 'firstName lastName email phone employeeId')
      .populate('reviewedBy', 'firstName lastName email')
      .lean();

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reports found'
      });
    }

    // Fetch all visits, quotations, planners and follow-ups for all reports
    const bulkData = await Promise.all(reports.map(async (report) => {
      const visits = await Visit.find({
        userId: report.userId._id,
        date: {
          $gte: report.weekStart,
          $lte: report.weekEnd
        }
      })
      .populate('userId', 'firstName lastName email employeeId')
      .populate('followUpActions.assignedTo', 'firstName lastName email')
      .sort({ date: 1 })
      .lean();

      const quotations = await Request.find({
        userId: report.userId._id,
        createdAt: {
          $gte: report.weekStart,
          $lte: report.weekEnd
        }
      })
      .populate('userId', 'firstName lastName email employeeId')
      .populate('response.respondedBy', 'firstName lastName email')
      .sort({ createdAt: 1 })
      .lean();

      const planners = await Planner.find({
        userId: report.userId._id,
        weekCreatedAt: { $gte: report.weekStart, $lte: report.weekEnd }
      }).lean();

      const followUps = await FollowUp.find({
        userId: report.userId._id,
        createdAt: { $gte: report.weekStart, $lte: report.weekEnd }
      }).lean();

      return {
        report,
        visits,
        quotations,
        planners,
        followUps,
        meta: {
          totalVisits: visits.length,
          totalQuotations: quotations.length,
          totalPlanners: planners.length,
          totalFollowUps: followUps.length,
          weekRange: report.weekRange,
          submittedAt: report.createdAt,
          salesRep: {
            name: `${report.userId.firstName} ${report.userId.lastName}`,
            email: report.userId.email,
            employeeId: report.userId.employeeId,
            phone: report.userId.phone
          }
        }
      };
    }));

    res.json({
      success: true,
      data: bulkData
    });

  } catch (error) {
    logger.error('Bulk fetch reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
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

    if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);

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
