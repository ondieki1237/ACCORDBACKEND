import express from 'express';
import Trail from '../models/Trail.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateTrail, validatePagination, validateDateRange } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   POST /api/trails
// @desc    Create new trail
// @access  Private
router.post('/', authenticate, validateTrail, async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      path,
      stops,
      deviceInfo
    } = req.body;

    // Calculate trail statistics
    const coordinates = path.coordinates;
    let totalDistance = 0;
    
    // Calculate total distance using Haversine formula
    for (let i = 1; i < coordinates.length; i++) {
      totalDistance += calculateDistance(
        coordinates[i-1][1], coordinates[i-1][0], // lat, lng
        coordinates[i][1], coordinates[i][0]
      );
    }

    // Calculate duration and average speed
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const totalDuration = (end - start) / (1000 * 60); // minutes
    const averageSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 60)) : 0; // km/h

    const trail = new Trail({
      userId: req.user._id,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      path,
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      totalDuration: Math.round(totalDuration),
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      stops: stops || [],
      deviceInfo
    });

    await trail.save();

    // Emit real-time update to admin dashboard
    req.app.get('io').emit('trailUpdate', {
      userId: req.user._id,
      trailId: trail._id,
      location: coordinates[coordinates.length - 1],
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Trail recorded successfully',
      data: trail
    });
  } catch (error) {
    logger.error('Trail creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record trail'
    });
  }
});

// @route   GET /api/trails
// @desc    Get trails (with filters)
// @access  Private
router.get('/', authenticate, validatePagination, validateDateRange, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      userId
    } = req.query;

    // Build query
    const query = {};

    // Role-based access
    if (req.user.role === 'sales') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
      populate: {
        path: 'userId',
        select: 'firstName lastName employeeId region'
      }
    };

    const trails = await Trail.paginate(query, options);

    res.json({
      success: true,
      data: trails
    });
  } catch (error) {
    logger.error('Get trails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trails'
    });
  }
});

// @route   GET /api/trails/:id
// @desc    Get single trail
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id)
      .populate('userId', 'firstName lastName employeeId region');

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Trail not found'
      });
    }

    // Check permission
    if (req.user.role === 'sales' && trail.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: trail
    });
  } catch (error) {
    logger.error('Get trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trail'
    });
  }
});

// @route   PUT /api/trails/:id
// @desc    Update trail
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Trail not found'
      });
    }

    // Check permission
    if (req.user.role === 'sales' && trail.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedTrail = await Trail.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName employeeId region');

    res.json({
      success: true,
      message: 'Trail updated successfully',
      data: updatedTrail
    });
  } catch (error) {
    logger.error('Update trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trail'
    });
  }
});

// @route   DELETE /api/trails/:id
// @desc    Delete trail
// @access  Private (Admin/Manager only)
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Trail not found'
      });
    }

    await Trail.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Trail deleted successfully'
    });
  } catch (error) {
    logger.error('Delete trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trail'
    });
  }
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default router;