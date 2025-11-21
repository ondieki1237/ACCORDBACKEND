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
    const payload = { ...req.body };
    const facility = new Facility(payload);
    await facility.save();
    res.status(201).json({ success: true, data: facility, message: 'Facility created' });
  } catch (err) {
    logger.error('Create facility error:', err);
    next(err);
  }
};
