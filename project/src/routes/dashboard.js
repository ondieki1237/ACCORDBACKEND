import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Trail from '../models/Trail.js';
import Visit from '../models/Visit.js';
import Order from '../models/Order.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateDateRange } from '../middleware/validation.js';
import logger from '../utils/logger.js';
import { getSalesHeatmap, getPerformance, getAdvancedAnalytics } from '../controllers/dashboardController.js';

const router = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview data
// @access  Private (Admin/Manager)
router.get('/overview', authenticate, authorize('admin', 'manager'), validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    // Default to last 30 days if no date range provided
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const matchStage = {
      date: {
        $gte: startDate ? new Date(startDate) : defaultStartDate,
        $lte: endDate ? new Date(endDate) : new Date()
      }
    };

    // Regional filter for managers
    if (req.user.role === 'manager' || region) {
      const userFilter = { isActive: true };
      if (region) userFilter.region = region;
      if (req.user.role === 'manager') userFilter.region = req.user.region;

      const regionUsers = await User.find(userFilter, '_id');
      matchStage.userId = { $in: regionUsers.map(u => u._id) };
    }

    // Get overview statistics
    const [visitStats, trailStats, orderStats, activeUsers] = await Promise.all([
      // Visit statistics
      Visit.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: 1 },
            successfulVisits: {
              $sum: { $cond: [{ $eq: ['$visitOutcome', 'successful'] }, 1, 0] }
            },
            totalContacts: { $sum: { $size: '$contacts' } },
            totalPotentialValue: { $sum: '$totalPotentialValue' },
            averageDuration: { $avg: '$duration' }
          }
        }
      ]),

      // Trail statistics
      Trail.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalDistance: { $sum: '$totalDistance' },
            totalDuration: { $sum: '$totalDuration' },
            averageSpeed: { $avg: '$averageSpeed' }
          }
        }
      ]),

      // Order statistics
      Order.aggregate([
        { 
          $match: {
            ...matchStage,
            createdAt: matchStage.date
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$totalAmount' },
            approvedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
            }
          }
        }
      ]),

      // Active users count
      User.countDocuments({ 
        isActive: true, 
        role: 'sales',
        ...(region && { region })
      })
    ]);

    // Get daily activity trends
    const activityTrends = await Visit.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
          },
          visits: { $sum: 1 },
          contacts: { $sum: { $size: '$contacts' } },
          potentialValue: { $sum: '$totalPotentialValue' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          visits: visitStats[0] || { totalVisits: 0, successfulVisits: 0, totalContacts: 0, totalPotentialValue: 0, averageDuration: 0 },
          trails: trailStats[0] || { totalDistance: 0, totalDuration: 0, averageSpeed: 0 },
          orders: orderStats[0] || { totalOrders: 0, totalValue: 0, approvedOrders: 0, pendingOrders: 0 },
          activeUsers
        },
        trends: activityTrends
      }
    });
  } catch (error) {
    logger.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

// @route   GET /api/dashboard/heatmap
// @desc    Get static heatmap data (for demo/testing)
// @access  Public or Private (as needed)
router.get('/heatmap', (req, res) => {
  const heatmapData = [
    { lat: -1.2921, lng: 36.8219, intensity: 10 }, // Nairobi
    { lat: -4.0435, lng: 39.6682, intensity: 15 }, // Mombasa
    { lat: 0.5167, lng: 35.2833, intensity: 8 },   // Eldoret
    { lat: -0.0917, lng: 34.7680, intensity: 12 }, // Kisumu
    { lat: -0.4167, lng: 36.9500, intensity: 6 },  // Nyeri
  ];
  res.json(heatmapData);
});

// @route   GET /api/dashboard/performance
// @desc    Get sales performance metrics
// @access  Private (Admin/Manager)
router.get('/performance', authenticate, authorize('admin', 'manager'), getPerformance);

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity feed
// @access  Private (Admin/Manager)
router.get('/recent-activity', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent visits, orders, and trails
    const [recentVisits, recentOrders, recentTrails] = await Promise.all([
      Visit.find({})
        .populate('userId', 'firstName lastName employeeId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 3)
        .select('client visitOutcome totalPotentialValue createdAt'),

      Order.find({})
        .populate('userId', 'firstName lastName employeeId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 3)
        .select('client status totalAmount createdAt'),

      Trail.find({})
        .populate('userId', 'firstName lastName employeeId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 3)
        .select('totalDistance totalDuration createdAt')
    ]);

    // Combine and sort activities
    const activities = [
      ...recentVisits.map(visit => ({
        type: 'visit',
        id: visit._id,
        user: visit.userId,
        data: {
          client: visit.client,
          outcome: visit.visitOutcome,
          potentialValue: visit.totalPotentialValue
        },
        timestamp: visit.createdAt
      })),
      ...recentOrders.map(order => ({
        type: 'order',
        id: order._id,
        user: order.userId,
        data: {
          client: order.client,
          status: order.status,
          amount: order.totalAmount
        },
        timestamp: order.createdAt
      })),
      ...recentTrails.map(trail => ({
        type: 'trail',
        id: trail._id,
        user: trail.userId,
        data: {
          distance: trail.totalDistance,
          duration: trail.totalDuration
        },
        timestamp: trail.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activity'
    });
  }
});

// @route   GET /api/dashboard/heatmap/sales
// @desc    Get sales heatmap data
// @access  Private (Admin/Manager)
router.get('/heatmap/sales', getSalesHeatmap);

// @route   GET /api/dashboard/analytics
// @desc    Get advanced analytics by region
// @access  Private (Admin/Manager)
router.get('/analytics', authenticate, authorize('admin', 'manager'), getAdvancedAnalytics);

// @route   GET /api/dashboard/heatmap/live
// @desc    Get live heatmap data from trails
// @access  Private (Admin/Manager)
router.get('/heatmap/live', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Fetch all trails with user info
    const trails = await Trail.find({})
      .populate('userId', 'firstName lastName employeeId region')
      .select('userId path.coordinates');

    // Build response: one object per trail
    const trailData = trails.map(trail => ({
      user: {
        id: trail.userId?._id,
        employeeId: trail.userId?.employeeId,
        name: `${trail.userId?.firstName || ''} ${trail.userId?.lastName || ''}`.trim(),
        region: trail.userId?.region
      },
      path: (trail.path?.coordinates || []).map(coord => ({
        lat: Number(coord[1]),
        lng: Number(coord[0])
      }))
    }));

    res.json({ success: true, data: trailData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch heatmap data' });
  }
});

export default router;