import mongoose from 'mongoose';
import Visit from '../../src/models/Visit.js';
import User from '../../src/models/User.js';
import logger from '../../src/utils/logger.js';

// Admin: GET /api/admin/visits
export async function listAdminVisits(req, res) {
  try {
    const {
      page = 1,
      limit = 25,
      startDate,
      endDate,
      clientName,
      contactName,
      outcome,
      tag,
      sort,
      userId,
      region
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(10000, Math.max(1, parseInt(limit, 10) || 25));

    // Helper to parse start/end of day
    const parseDateStart = (d) => {
      if (!d) return null;
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    };
    const parseDateEnd = (d) => {
      if (!d) return null;
      const dt = new Date(d);
      dt.setHours(23, 59, 59, 999);
      return dt;
    };

    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = parseDateStart(startDate);
      if (endDate) match.date.$lte = parseDateEnd(endDate);
    }
    if (clientName) match['client.name'] = { $regex: clientName, $options: 'i' };
    if (contactName) match['contacts.name'] = { $regex: contactName, $options: 'i' };
    if (outcome) match.visitOutcome = outcome;
    if (tag) match.tags = tag;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) match.userId = mongoose.Types.ObjectId(userId);

    const pipeline = [ { $match: match } ];

    // Lookup user
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    });
    pipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });

    if (region) {
      pipeline.push({ $match: { 'user.region': region } });
    }

    if (sort) {
      const s = {};
      const key = sort.startsWith('-') ? sort.slice(1) : sort;
      s[key] = sort.startsWith('-') ? -1 : 1;
      pipeline.push({ $sort: s });
    } else {
      pipeline.push({ $sort: { date: -1, createdAt: -1 } });
    }

    pipeline.push({
      $facet: {
        data: [ { $skip: (pageNum - 1) * perPage }, { $limit: perPage } ],
        totalCount: [ { $count: 'count' } ]
      }
    });

    const aggResult = await Visit.aggregate(pipeline).allowDiskUse(true).exec();
    const data = (aggResult[0] && aggResult[0].data) || [];
    const totalCount = (aggResult[0] && aggResult[0].totalCount[0] && aggResult[0].totalCount[0].count) || 0;

    // Transform user -> userId projection
    const transformed = data.map(v => {
      if (v.user) {
        v.userId = {
          _id: v.user._id,
          firstName: v.user.firstName,
          lastName: v.user.lastName,
          email: v.user.email,
          role: v.user.role,
          employeeId: v.user.employeeId,
          region: v.user.region
        };
      }
      delete v.user;
      return v;
    });

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return res.json({
      success: true,
      data: transformed,
      meta: {
        totalDocs: totalCount,
        limit: perPage,
        page: pageNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    logger.error('listAdminVisits error', err);
    return res.status(500).json({ success: false, message: 'Failed to list admin visits' });
  }
}

/**
 * GET /api/admin/visits/user/:userId
 * Query: page, limit, startDate, endDate, clientName, contactName, outcome, tag, sort
 */
export async function getUserVisitsAdmin(req, res) {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 25,
      startDate,
      endDate,
      clientName,
      contactName,
      outcome,
      tag,
      sort = '-date'
    } = req.query;

    // Build query; treat literal 'null'/'undefined'/'all' as no user filter
    const q = {};
    if (userId && !['null', 'undefined', 'all'].includes(String(userId).toLowerCase())) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId parameter' });
      }
      q.userId = mongoose.Types.ObjectId(userId);
    }

    if (startDate || endDate) {
      q.date = {};
      if (startDate) q.date.$gte = new Date(startDate);
      if (endDate) q.date.$lte = new Date(endDate);
    }

    if (clientName) q['client.name'] = { $regex: clientName, $options: 'i' };
    if (contactName) q['contacts.name'] = { $regex: contactName, $options: 'i' };
    if (outcome) q.visitOutcome = outcome;
    if (tag) q.tags = tag;

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort,
      populate: [
        { path: 'userId', select: 'firstName lastName email role' },
        { path: 'followUpVisits' },
        { path: 'followUpActions.assignedTo', select: 'firstName lastName email role' }
      ],
      lean: true
    };

    const result = await Visit.paginate(q, options);

    return res.json({
      success: true,
      data: result.docs,
      meta: {
        totalDocs: result.totalDocs,
        limit: result.limit,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (err) {
    logger.error('getUserVisitsAdmin error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user visits' });
  }
}

/**
 * GET /api/admin/visits/summary
 * Returns per-user visit counts and last visit date (optional limit)
 */
export async function getVisitsSummary(req, res) {
  try {
    const { limit = 50 } = req.query;

    const agg = await Visit.aggregate([
      {
        $group: {
          _id: '$userId',
          visitsCount: { $sum: 1 },
          lastVisit: { $max: '$date' }
        }
      },
      { $sort: { visitsCount: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          visitsCount: 1,
          lastVisit: 1,
          user: { _id: '$user._id', firstName: '$user.firstName', lastName: '$user.lastName', email: '$user.email', role: '$user.role' }
        }
      }
    ]);

    return res.json({ success: true, data: agg });
  } catch (err) {
    logger.error('getVisitsSummary error', err);
    return res.status(500).json({ success: false, message: 'Failed to build visits summary' });
  }
}

/**
 * GET /api/admin/visits/:id
 * Get single visit by id (admin)
 */
export async function getVisitByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    const visit = await Visit.findById(id)
      .populate('userId', 'firstName lastName email role')
      .lean();
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    return res.json({ success: true, data: visit });
  } catch (err) {
    logger.error('getVisitByIdAdmin error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch visit' });
  }
}

/**
 * GET /api/admin/visits/daily/activities
 * Get all daily visits from sales team with optional date filtering
 * Query: date (defaults to today), page, limit, region, userId, outcome
 */
export async function getDailyVisitsActivities(req, res) {
  try {
    const {
      date,
      page = 1,
      limit = 50,
      region,
      userId,
      outcome
    } = req.query;

    // Default to today if no date provided
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query
    const query = {
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    // Filter by userId if provided
    if (userId) {
      query.userId = userId;
    } else if (region) {
      // If region filter, get all sales users in that region
      const regionUsers = await User.find({ 
        role: 'sales', 
        region,
        isActive: true 
      }).select('_id');
      query.userId = { $in: regionUsers.map(u => u._id) };
    } else {
      // Get all active sales users
      const salesUsers = await User.find({ 
        role: 'sales',
        isActive: true 
      }).select('_id');
      query.userId = { $in: salesUsers.map(u => u._id) };
    }

    // Filter by outcome if provided
    if (outcome) {
      query.visitOutcome = outcome;
    }

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort: '-date -createdAt',
      populate: [
        { 
          path: 'userId', 
          select: 'firstName lastName email employeeId region role' 
        },
        { path: 'followUpVisits' },
        { path: 'followUpActions.assignedTo', select: 'firstName lastName email role' }
      ],
      lean: true
    };

    const result = await Visit.paginate(query, options);

    // Add summary statistics
    const summary = {
      totalVisits: result.totalDocs,
      date: targetDate.toISOString().split('T')[0],
      visitsByOutcome: {}
    };

    // Calculate visits by outcome
    if (result.docs.length > 0) {
      const outcomeStats = await Visit.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$visitOutcome',
            count: { $sum: 1 }
          }
        }
      ]);
      outcomeStats.forEach(stat => {
        summary.visitsByOutcome[stat._id || 'unspecified'] = stat.count;
      });
    }

    return res.json({
      success: true,
      data: result.docs,
      summary,
      meta: {
        totalDocs: result.totalDocs,
        limit: result.limit,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });
  } catch (err) {
    logger.error('getDailyVisitsActivities error', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch daily visits activities' 
    });
  }
}