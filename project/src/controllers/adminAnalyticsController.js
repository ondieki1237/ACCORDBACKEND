import mongoose from 'mongoose';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Quotation from '../models/Quotation.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

// Helper to parse date range
function parseRange(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();
  return { start, end };
}

/**
 * GET /api/admin/analytics/top-products
 */
export async function getTopProducts(req, res) {
  try {
    const { startDate, endDate, limit = 5 } = req.query;
    const { start, end } = parseRange(startDate, endDate);

    const agg = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.consumableId',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      } },
      { $sort: { unitsSold: -1, revenue: -1 } },
      { $limit: Number(limit) }
    ]).allowDiskUse(true);

    const data = agg.map(a => ({ id: a._id, name: a.name, unitsSold: a.unitsSold, revenue: a.revenue }));
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('getTopProducts error', err);
    return res.status(500).json({ success: false, message: 'Failed to compute top products' });
  }
}

/**
 * GET /api/admin/analytics/leaderboard/reps
 */
export async function getRepsLeaderboard(req, res) {
  try {
    const { startDate, endDate, metric = 'visits', limit = 10 } = req.query;
    const { start, end } = parseRange(startDate, endDate);

    if (metric === 'visits') {
      const agg = await Visit.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: Number(limit) },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { userId: '$_id', name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, count: 1 } }
      ]).allowDiskUse(true);
      return res.json({ success: true, data: agg });
    }

    if (metric === 'revenue') {
      // Use Visit.totalPotentialValue as proxy for opportunity/revenue
      const agg = await Visit.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$userId', revenue: { $sum: { $ifNull: ['$totalPotentialValue', 0] } } } },
        { $sort: { revenue: -1 } },
        { $limit: Number(limit) },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { userId: '$_id', name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, revenue: 1 } }
      ]).allowDiskUse(true);
      return res.json({ success: true, data: agg });
    }

    if (metric === 'leads') {
      const agg = await Quotation.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: Number(limit) },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { userId: '$_id', name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, count: 1 } }
      ]).allowDiskUse(true);
      return res.json({ success: true, data: agg });
    }

    return res.status(400).json({ success: false, message: 'Unsupported metric' });
  } catch (err) {
    logger.error('getRepsLeaderboard error', err);
    return res.status(500).json({ success: false, message: 'Failed to compute reps leaderboard' });
  }
}

/**
 * GET /api/admin/analytics/leaderboard/facilities
 */
export async function getFacilitiesLeaderboard(req, res) {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const { start, end } = parseRange(startDate, endDate);

    const agg = await Visit.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: '$client.name', visits: { $sum: 1 }, lastVisit: { $max: '$date' }, location: { $first: '$client.location' } } },
      { $sort: { visits: -1 } },
      { $limit: Number(limit) },
      { $project: { _id: 0, name: '$_id', location: 1, visits: 1, lastVisit: 1 } }
    ]).allowDiskUse(true);

    return res.json({ success: true, data: agg });
  } catch (err) {
    logger.error('getFacilitiesLeaderboard error', err);
    return res.status(500).json({ success: false, message: 'Failed to compute facilities leaderboard' });
  }
}

/**
 * GET /api/admin/analytics/revenue-summary
 */
export async function getRevenueSummary(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = parseRange(startDate, endDate);

    // Total opportunity value (sum of totalPotentialValue from visits)
    const oppAgg = await Visit.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, totalOpportunityValue: { $sum: { $ifNull: ['$totalPotentialValue', 0] } } } }
    ]).allowDiskUse(true);
    const totalOpportunityValue = (oppAgg[0] && oppAgg[0].totalOpportunityValue) || 0;

    // Closed revenue this month (paid orders)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const paidAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, closedRevenueThisMonth: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
    ]).allowDiskUse(true);
    const closedRevenueThisMonth = (paidAgg[0] && paidAgg[0].closedRevenueThisMonth) || 0;

    // Last month revenue for growth calculation
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const lastPaidAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, revenue: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
    ]).allowDiskUse(true);
    const lastMonthRevenue = (lastPaidAgg[0] && lastPaidAgg[0].revenue) || 0;

    const salesGrowth = lastMonthRevenue === 0 ? (closedRevenueThisMonth > 0 ? 100 : 0) : Math.round(((closedRevenueThisMonth - lastMonthRevenue) / lastMonthRevenue) * 100);

    return res.json({ success: true, data: { totalOpportunityValue, closedRevenueThisMonth, salesGrowth } });
  } catch (err) {
    logger.error('getRevenueSummary error', err);
    return res.status(500).json({ success: false, message: 'Failed to compute revenue summary' });
  }
}

export async function getSalesAnalytics(req, res) {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId parameter' });
    }

    // convert once using `new` to avoid the "cannot be invoked without 'new'" error
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    const user = await User.findById(userObjectId, 'firstName lastName email role region').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // visits count and last visit
    const visitsCount = await Visit.countDocuments({ userId: userObjectId, date: { $gte: start, $lte: end } });
    const lastVisitDoc = await Visit.findOne({ userId: userObjectId }).sort({ date: -1 }).lean();

    // top clients
    const topClients = await Visit.aggregate([
      { $match: { userId: userObjectId, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$client._id', name: { $first: '$client.name' }, visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 10 }
    ]);

    // quotations
    const quotations = await Quotation.find({ requester: userObjectId, createdAt: { $gte: start, $lte: end } })
      .select('_id status total createdAt items')
      .lean();

    // orders & revenue
    const orders = await Order.find({ salesRep: userObjectId, createdAt: { $gte: start, $lte: end } })
      .select('_id status total createdAt items')
      .lean();
    const ordersPlaced = orders.length;
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const avgDealSize = ordersPlaced ? revenue / ordersPlaced : 0;

    // timeSeries (simple monthly)
    const timeSeries = await Visit.aggregate([
      { $match: { userId: userObjectId, date: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, visits: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      success: true,
      data: {
        user,
        period: { startDate: start.toISOString(), endDate: end.toISOString() },
        summary: {
          visitsCount,
          uniqueClients: topClients.length,
          quotationsRequested: quotations.length,
          ordersPlaced,
          revenue,
          avgDealSize,
          lastVisit: lastVisitDoc ? lastVisitDoc.date : null
        },
        topClients,
        topProducts: [],
        visits: [],
        quotations,
        orders,
        timeSeries
      }
    });
  } catch (err) {
    logger.error('getSalesAnalytics error', err);
    const message = process.env.NODE_ENV === 'production' ? 'Failed to fetch analytics' : err.message;
    const payload = { success: false, message };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    return res.status(500).json(payload);
  }
}