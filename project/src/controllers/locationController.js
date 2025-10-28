import LocationTrack from '../models/LocationTrack.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Track location data (supports single or batch/offline upload)
export const trackLocation = async (req, res, next) => {
  try {
    // If the request was authenticated, use req.user._id. Otherwise allow a client to supply userId in the body.
    let userId = req.user && req.user._id ? req.user._id : null;
    const { locations = [], deviceInfo, userId: bodyUserId } = req.body;

    if (!userId) {
      // If no authenticated user, require a body userId and validate it exists
      if (!bodyUserId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required or provide userId in body' 
        });
      }

      const found = await User.findById(bodyUserId).select('_id');
      if (!found) {
        return res.status(400).json({ 
          success: false, 
          message: 'Provided userId does not exist' 
        });
      }
      userId = found._id;
    }

    // Validate locations array
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'locations array is required and must contain at least one location point' 
      });
    }

    // Convert timestamp (ms) to Date objects
    const processedLocations = locations.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      timestamp: new Date(loc.timestamp),
      speed: loc.speed,
      heading: loc.heading,
      altitude: loc.altitude
    }));

    const processedDeviceInfo = deviceInfo ? {
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      timestamp: deviceInfo.timestamp ? new Date(deviceInfo.timestamp) : new Date()
    } : null;

    const locationTrack = new LocationTrack({
      userId,
      locations: processedLocations,
      deviceInfo: processedDeviceInfo,
      syncedAt: new Date()
    });

    await locationTrack.save();

    res.status(201).json({ 
      success: true, 
      message: `${processedLocations.length} location(s) tracked successfully`,
      data: {
        trackId: locationTrack._id,
        userId: locationTrack.userId,
        locationsCount: processedLocations.length,
        syncedAt: locationTrack.syncedAt
      }
    });
  } catch (err) {
    logger.error('trackLocation error:', err);
    next(err);
  }
};

// Get location history for authenticated user (with filters)
export const getMyLocationHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50, from, to } = req.query;

    const q = { userId };

    // Filter by date range if provided
    if (from || to) {
      q.syncedAt = {};
      if (from) q.syncedAt.$gte = new Date(from);
      if (to) q.syncedAt.$lte = new Date(to);
    }

    const tracks = await LocationTrack.find(q)
      .sort({ syncedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await LocationTrack.countDocuments(q);

    res.json({ 
      success: true, 
      data: tracks, 
      meta: { 
        page: Number(page), 
        limit: Number(limit), 
        totalDocs: total,
        totalPages: Math.ceil(total / limit)
      } 
    });
  } catch (err) {
    logger.error('getMyLocationHistory error:', err);
    next(err);
  }
};

// Admin: get location history for all users or specific user
export const adminGetLocationHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, from, to } = req.query;
    const q = {};

    if (userId) q.userId = userId;

    if (from || to) {
      q.syncedAt = {};
      if (from) q.syncedAt.$gte = new Date(from);
      if (to) q.syncedAt.$lte = new Date(to);
    }

    const tracks = await LocationTrack.find(q)
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ syncedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await LocationTrack.countDocuments(q);

    res.json({ 
      success: true, 
      data: tracks, 
      meta: { 
        page: Number(page), 
        limit: Number(limit), 
        totalDocs: total,
        totalPages: Math.ceil(total / limit)
      } 
    });
  } catch (err) {
    logger.error('adminGetLocationHistory error:', err);
    next(err);
  }
};
