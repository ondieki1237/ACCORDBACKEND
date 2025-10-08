import EngineeringService from '../models/EngineeringService.js';
import logger from '../utils/logger.js';

export const createEngineeringService = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      userId: req.user ? req.user._id : undefined,
      syncedAt: req.user ? new Date() : undefined,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    const service = new EngineeringService(payload);
    await service.save();
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    logger.error('Create engineering service error:', err);
    next(err);
  }
};

export const getEngineeringServices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      serviceType,
      facilityName,
      facilityLocation,
      userId,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (serviceType) query.serviceType = serviceType;
    if (facilityName) query['facility.name'] = new RegExp(facilityName, 'i');
    if (facilityLocation) query['facility.location'] = new RegExp(facilityLocation, 'i');
    if (userId) query.userId = userId;

    // date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort: { createdAt: -1 }
    };

    const results = await EngineeringService.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Get engineering services error:', err);
    next(err);
  }
};

export const getEngineeringServiceById = async (req, res, next) => {
  try {
    const service = await EngineeringService.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err) {
    logger.error('Get engineering service by id error:', err);
    next(err);
  }
};

export const getServicesByEngineer = async (req, res, next) => {
  try {
    const { engineerId } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const query = { userId: engineerId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const options = { page: Number(page), limit: Number(limit), sort: { date: -1 } };
    const results = await EngineeringService.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Get services by engineer error:', err);
    next(err);
  }
};

export const getServicesByFacility = async (req, res, next) => {
  try {
    const { facilityName, facilityLocation } = req.query;
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const query = {};

    if (facilityName) query['facility.name'] = new RegExp(facilityName, 'i');
    if (facilityLocation) query['facility.location'] = new RegExp(facilityLocation, 'i');

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const options = { page: Number(page), limit: Number(limit), sort: { date: -1 } };
    const results = await EngineeringService.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Get services by facility error:', err);
    next(err);
  }
};

export const assignServiceToEngineer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { engineerId, engineerName, engineerPhone, scheduledDate, facility, activity, notes, location } = req.body;

    const service = await EngineeringService.findById(id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    // Update fields
    if (engineerId) service.userId = engineerId;
    if (engineerName || engineerPhone) service.engineerInCharge = { name: engineerName, phone: engineerPhone };
    if (scheduledDate) service.date = new Date(scheduledDate);
    if (facility) service.facility = facility;
    if (activity) service.serviceType = activity;
    if (notes) service.notes = notes;
    if (location) service.location = location;

    service.status = 'scheduled';
    service.metadata = service.metadata || {};
    service.metadata.assignedBy = req.user ? req.user._id : null;
    service.metadata.assignedAt = new Date();

    await service.save();
    res.json({ success: true, message: 'Service assigned to engineer successfully', data: service });
  } catch (err) {
    logger.error('Assign service error:', err);
    next(err);
  }
};
