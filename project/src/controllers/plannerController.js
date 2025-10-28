import Planner from '../models/Planner.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Create a planner for the authenticated user
export const createPlanner = async (req, res, next) => {
  try {
    // If the request was authenticated, use req.user._id. Otherwise allow a client to supply userId in the body.
    let userId = req.user && req.user._id ? req.user._id : null;
    const { weekCreatedAt, days = [], notes, userId: bodyUserId } = req.body;

    if (!userId) {
      // If no authenticated user, require a body userId and validate it exists
      if (!bodyUserId) {
        return res.status(401).json({ success: false, message: 'Authentication required or provide userId in body' });
      }

      const found = await User.findById(bodyUserId).select('_id');
      if (!found) return res.status(400).json({ success: false, message: 'Provided userId does not exist' });
      userId = found._id;
    }

    if (!weekCreatedAt) {
      return res.status(400).json({ success: false, message: 'weekCreatedAt is required' });
    }

    // Strip out Saturday and Sunday entries (case-insensitive)
    const filteredDays = Array.isArray(days)
      ? days.filter(d => {
          if (!d || !d.day) return false;
          const name = String(d.day).trim().toLowerCase();
          return name !== 'saturday' && name !== 'sunday';
        })
      : [];

    const planner = new Planner({
      userId,
      weekCreatedAt: new Date(weekCreatedAt),
      days: filteredDays,
      notes
    });

    await planner.save();

    res.status(201).json({ success: true, data: planner });
  } catch (err) {
    logger.error('createPlanner error:', err);
    next(err);
  }
};

// Get planners for the authenticated user
export const getMyPlanners = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const planners = await Planner.find({ userId })
      .sort({ weekCreatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Remove any weekend entries before returning (defensive)
    const cleaned = planners.map(p => ({
      ...p,
      days: Array.isArray(p.days) ? p.days.filter(d => {
        if (!d || !d.day) return false;
        const name = String(d.day).trim().toLowerCase();
        return name !== 'saturday' && name !== 'sunday';
      }) : []
    }));

    const total = await Planner.countDocuments({ userId });

  res.json({ success: true, data: cleaned, meta: { page: Number(page), limit: Number(limit), totalDocs: total } });
  } catch (err) {
    logger.error('getMyPlanners error:', err);
    next(err);
  }
};

// Admin: get all planners (with optional filters)
export const adminGetAllPlanners = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, from, to } = req.query;
    const q = {};

    if (userId) q.userId = userId;
    if (from || to) q.weekCreatedAt = {};
    if (from) q.weekCreatedAt.$gte = new Date(from);
    if (to) q.weekCreatedAt.$lte = new Date(to);

    const planners = await Planner.find(q)
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ weekCreatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Planner.countDocuments(q);

    // Defensive removal of weekend entries in admin output as well
    const cleanedAdmin = planners.map(p => ({
      ...p,
      days: Array.isArray(p.days) ? p.days.filter(d => {
        if (!d || !d.day) return false;
        const name = String(d.day).trim().toLowerCase();
        return name !== 'saturday' && name !== 'sunday';
      }) : []
    }));

    res.json({ success: true, data: cleanedAdmin, meta: { page: Number(page), limit: Number(limit), totalDocs: total } });
  } catch (err) {
    logger.error('adminGetAllPlanners error:', err);
    next(err);
  }
};
