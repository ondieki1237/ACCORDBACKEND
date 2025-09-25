import mongoose from 'mongoose';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Quotation from '../models/Quotation.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

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