import Visit from '../models/Visit.js';
import User from '../models/User.js';

// Returns heatmap data: visits per sales person, grouped by location
export const getSalesHeatmap = async (req, res, next) => {
  try {
    const heatmap = await Visit.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: { userId: "$user._id", userName: { $concat: ["$user.firstName", " ", "$user.lastName"] }, location: "$location" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          userId: "$_id.userId",
          userName: "$_id.userName",
          location: "$_id.location",
          count: 1
        }
      }
    ]);
    res.json({ success: true, data: heatmap });
  } catch (err) {
    next(err);
  }
};

// Performance report: total visits per user in a given date range and region
export const getPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate, region } = req.query;

    // Build match stage for aggregation
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    // If region is provided, filter users by region and get their IDs
    let userIds = [];
    if (region) {
      const usersInRegion = await User.find({ region }).select('_id');
      userIds = usersInRegion.map(u => u._id);
      if (userIds.length > 0) {
        matchStage.user = { $in: userIds };
      } else {
        // No users in region, return empty data
        return res.json({ success: true, data: [] });
      }
    }

    // Aggregate visits for users in the region and date range
    const performance = await Visit.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$user",
          totalVisits: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          region: "$user.region",
          totalVisits: 1
        }
      }
    ]);

    res.json({ success: true, data: performance });
  } catch (err) {
    next(err);
  }
};