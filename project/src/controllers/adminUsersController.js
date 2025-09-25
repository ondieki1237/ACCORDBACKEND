import User from '../models/User.js';
import logger from '../utils/logger.js';

export async function listAdminUsers(req, res) {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const q = {};
    if (search) q.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const users = await User.find(q, 'firstName lastName email role region')
      .sort({ firstName: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments(q);

    return res.json({
      success: true,
      data: users,
      meta: { page: Number(page), limit: Number(limit), totalDocs: total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    logger.error('listAdminUsers', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}