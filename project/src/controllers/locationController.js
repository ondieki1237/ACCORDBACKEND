import LocationTrack from '../models/LocationTrack.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { reverseGeocode } from '../utils/reverseGeocode.js';

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

    // Convert timestamp (ms) to Date objects and add human-readable location
    const rawLocations = await Promise.all(locations.map(async (loc) => {
      let locationName = 'Unknown location';
      if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        locationName = await reverseGeocode(loc.latitude, loc.longitude);
      }
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: new Date(loc.timestamp),
        speed: loc.speed,
        heading: loc.heading,
        altitude: loc.altitude,
        locationName
      };
    }));

    // --- Compression settings ---
    // Default: collapse points within 2 meters for at least 5 minutes
    const DISTANCE_THRESHOLD_METERS = Number(process.env.LOCATION_CLUSTER_DISTANCE_METERS) || 2;
    const TIME_THRESHOLD_MS = (Number(process.env.LOCATION_CLUSTER_TIME_SECONDS) || 300) * 1000;

    // Allow client to override thresholds for sync requests (optional)
    const clientDistance = req.body.clusterDistanceMeters !== undefined ? Number(req.body.clusterDistanceMeters) : undefined;
    const clientTime = req.body.clusterTimeSeconds !== undefined ? Number(req.body.clusterTimeSeconds) : undefined;
    const distanceThreshold = !isNaN(clientDistance) ? clientDistance : DISTANCE_THRESHOLD_METERS;
    const timeThresholdMs = !isNaN(clientTime) ? clientTime * 1000 : TIME_THRESHOLD_MS;

    // Helper: Haversine distance between two lat/lon in meters
    const haversine = (lat1, lon1, lat2, lon2) => {
      const toRad = v => (v * Math.PI) / 180;
      const R = 6371000; // meters
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Sort by timestamp ascending to build clusters
    const sorted = rawLocations.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const compressed = [];

    // Build clusters of consecutive points within distanceThreshold
    let cluster = null; // { points: [], centroidLat, centroidLon, startTs, endTs }

    const finalizeCluster = (c) => {
      if (!c) return;
      const durationMs = c.endTs - c.startTs;
      if (c.points.length >= 2 && durationMs >= timeThresholdMs) {
        // Collapse to a single aggregated point
        const avgAccuracy = c.points.reduce((s, p) => s + (p.accuracy || 0), 0) / c.points.length || undefined;
        compressed.push({
          latitude: c.centroidLat,
          longitude: c.centroidLon,
          accuracy: avgAccuracy,
          // use end timestamp to indicate when user left stationary state
          timestamp: new Date(c.endTs),
          aggregated: true,
          count: c.points.length,
          durationMs
        });
      } else {
        // Not long enough to collapse; emit all original points
        for (const p of c.points) compressed.push(p);
      }
    };

    for (const p of sorted) {
      if (!cluster) {
        cluster = {
          points: [p],
          centroidLat: p.latitude,
          centroidLon: p.longitude,
          startTs: p.timestamp.getTime(),
          endTs: p.timestamp.getTime()
        };
        continue;
      }

      const dist = haversine(cluster.centroidLat, cluster.centroidLon, p.latitude, p.longitude);
      if (dist <= distanceThreshold) {
        // add to cluster and update centroid (weighted average)
        cluster.points.push(p);
        cluster.endTs = Math.max(cluster.endTs, p.timestamp.getTime());
        // incremental centroid update
        const n = cluster.points.length;
        cluster.centroidLat = ((cluster.centroidLat * (n - 1)) + p.latitude) / n;
        cluster.centroidLon = ((cluster.centroidLon * (n - 1)) + p.longitude) / n;
      } else {
        // finalize current cluster and start a new one
        finalizeCluster(cluster);
        cluster = {
          points: [p],
          centroidLat: p.latitude,
          centroidLon: p.longitude,
          startTs: p.timestamp.getTime(),
          endTs: p.timestamp.getTime()
        };
      }
    }

    // finalize last cluster
    finalizeCluster(cluster);

    const processedLocations = compressed;

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

    // Ensure each location point includes locationName if available
    const tracksWithLocationName = tracks.map(track => ({
      ...track,
      locations: track.locations.map(loc => ({
        ...loc,
        locationName: loc.locationName || null
      }))
    }));

    res.json({ 
      success: true, 
      data: tracksWithLocationName, 
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
