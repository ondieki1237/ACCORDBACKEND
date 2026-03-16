import Facility from '../models/Facility.js';
import logger from '../utils/logger.js';

export const searchFacilities = async (req, res, next) => {
  try {
    const { search, county, limit = 20, page = 1 } = req.query;
    const query = {};
    if (search) query.$text = { $search: String(search) };
    if (county) query.county = new RegExp(county, 'i');

    const options = { page: Number(page), limit: Number(limit), sort: { name: 1 } };
    const results = await Facility.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Search facilities error:', err);
    next(err);
  }
};

export const getFacilityById = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id).lean();
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    res.json({ success: true, data: facility });
  } catch (err) {
    logger.error('Get facility error:', err);
    next(err);
  }
};

export const createFacility = async (req, res, next) => {
  try {
    let payload = { ...req.body };

    // Handle different payload formats
    // Format 1: GeoJSON format (with geometry and properties)
    if (payload.geometry && payload.properties) {
      const facility = new Facility({
        type: payload.type || 'Feature',
        geometry: payload.geometry,
        properties: payload.properties
      });
      await facility.save();
      
      logger.info('Facility created (GeoJSON format)', {
        facilityId: facility._id,
        name: payload.properties.name,
        userId: req.user._id
      });

      return res.status(201).json({
        success: true,
        message: 'Facility created successfully',
        data: facility
      });
    }

    // Format 2: Simple facility format (convert to GeoJSON)
    // Extract coordinates if provided
    const coordinates = [];
    if (payload.longitude && payload.latitude) {
      coordinates.push(Number(payload.longitude), Number(payload.latitude));
    }

    // Build properties from the payload
    const properties = {
      name: payload.name || payload.facility || '',
      location: payload.location || '',
      county: payload.county || '',
      constituency: payload.constituency || '',
      amenity: payload.amenity || 'clinic',
      healthcare: payload.healthcare || 'clinic'
    };

    // Only include non-empty properties
    Object.keys(properties).forEach(key => {
      if (!properties[key]) {
        delete properties[key];
      }
    });

    // If name is missing, reject
    if (!properties.name || properties.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Facility name is required',
        requiredFields: ['name']
      });
    }

    // Create geometry (point) if coordinates provided, otherwise use default
    const geometry = coordinates.length === 2
      ? {
          type: 'Point',
          coordinates: coordinates
        }
      : {
          type: 'Point',
          coordinates: [0, 0] // Default location
        };

    const facility = new Facility({
      type: 'Feature',
      geometry,
      properties
    });

    await facility.save();

    logger.info('Facility created successfully', {
      facilityId: facility._id,
      name: properties.name,
      location: properties.location,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Facility created successfully',
      data: facility
    });
  } catch (err) {
    logger.error('Create facility error:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      userId: req.user?._id
    });

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: messages
      });
    }

    next(err);
  }
};
