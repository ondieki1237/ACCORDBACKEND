import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Trail from '../models/Trail.js';
import Visit from '../models/Visit.js';
import Order from '../models/Order.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateDateRange } from '../middleware/validation.js';
import logger from '../utils/logger.js';

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
// @desc    Get heatmap data for trails
// @access  Private (Admin/Manager)
router.get('/heatmap', authenticate, authorize('admin', 'manager'), validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const matchStage = {};
    
    // Date range
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    // User filter
    if (userId) {
      matchStage.userId = mongoose.Types.ObjectId(userId);
    }

    const heatmapData = await Trail.aggregate([
      { $match: matchStage },
      { $unwind: '$path.coordinates' },
      {
        $group: {
          _id: {
            lat: { $round: [{ $arrayElemAt: ['$path.coordinates', 1] }, 4] },
            lng: { $round: [{ $arrayElemAt: ['$path.coordinates', 0] }, 4] }
          },
          intensity: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 0,
          lat: '$_id.lat',
          lng: '$_id.lng',
          intensity: 1,
          userCount: { $size: '$users' }
        }
      },
      { $sort: { intensity: -1 } },
      { $limit: 10000 } // Limit to prevent overwhelming the client
    ]);

    // Get user trails for individual tracking
    const userTrails = await Trail.find(matchStage)
      .populate('userId', 'firstName lastName employeeId')
      .select('userId date path totalDistance totalDuration')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: {
        heatmap: heatmapData,
        userTrails
      }
    });
  } catch (error) {
    logger.error('Heatmap data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve heatmap data'
    });
  }
});

// @route   GET /api/dashboard/performance
// @desc    Get sales performance metrics
// @access  Private (Admin/Manager)
router.get('/performance', authenticate, authorize('admin', 'manager'), validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const dateFilter = {
      $gte: startDate ? new Date(startDate) : defaultStartDate,
      $lte: endDate ? new Date(endDate) : new Date()
    };

    // Get user performance
    const userPerformance = await User.aggregate([
      {
        $match: {
          role: 'sales',
          isActive: true,
          ...(region && { region })
        }
      },
      {
        $lookup: {
          from: 'visits',
          localField: '_id',
          foreignField: 'userId',
          pipeline: [
            { $match: { date: dateFilter } }
          ],
          as: 'visits'
        }
      },
      {
        $lookup: {
          from: 'trails',
          localField: '_id',
          foreignField: 'userId',
          pipeline: [
            { $match: { date: dateFilter } }
          ],
          as: 'trails'
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          pipeline: [
            { $match: { createdAt: dateFilter } }
          ],
          as: 'orders'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          employeeId: 1,
          region: 1,
          territory: 1,
          targets: 1,
          performance: {
            totalVisits: { $size: '$visits' },
            successfulVisits: {
              $size: {
                $filter: {
                  input: '$visits',
                  cond: { $eq: ['$$this.visitOutcome', 'successful'] }
                }
              }
            },
            totalContacts: {
              $sum: {
                $map: {
                  input: '$visits',
                  as: 'visit',
                  in: { $size: '$$visit.contacts' }
                }
              }
            },
            totalDistance: {
              $sum: '$trails.totalDistance'
            },
            totalOrders: { $size: '$orders' },
            orderValue: {
              $sum: '$orders.totalAmount'
            },
            potentialValue: {
              $sum: '$visits.totalPotentialValue'
            }
          }
        }
      },
      {
        $addFields: {
          'performance.successRate': {
            $cond: [
              { $eq: ['$performance.totalVisits', 0] },
              0,
              {
                $multiply: [
                  { $divide: ['$performance.successfulVisits', '$performance.totalVisits'] },
                  100
                ]
              }
            ]
          },
          'performance.conversionRate': {
            $cond: [
              { $eq: ['$performance.totalVisits', 0] },
              0,
              {
                $multiply: [
                  { $divide: ['$performance.totalOrders', '$performance.totalVisits'] },
                  100
                ]
              }
            ]
          }
        }
      },
      { $sort: { 'performance.orderValue': -1 } }
    ]);

    // Get regional performance
    const regionalPerformance = await User.aggregate([
      {
        $match: {
          role: 'sales',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'visits',
          localField: '_id',
          foreignField: 'userId',
          pipeline: [
            { $match: { date: dateFilter } }
          ],
          as: 'visits'
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          pipeline: [
            { $match: { createdAt: dateFilter } }
          ],
          as: 'orders'
        }
      },
      {
        $group: {
          _id: '$region',
          totalUsers: { $sum: 1 },
          totalVisits: { $sum: { $size: '$visits' } },
          totalOrders: { $sum: { $size: '$orders' } },
          totalOrderValue: { $sum: { $sum: '$orders.totalAmount' } },
          totalPotentialValue: { $sum: { $sum: '$visits.totalPotentialValue' } }
        }
      },
      { $sort: { totalOrderValue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        userPerformance,
        regionalPerformance
      }
    });
  } catch (error) {
    logger.error('Performance data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance data'
    });
  }
});

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

export default router;