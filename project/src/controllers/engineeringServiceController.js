import EngineeringService from '../models/EngineeringService.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

export const createEngineeringService = async (req, res, next) => {
  try {
    const { 
      date, 
      facility, 
      serviceType, 
      engineerInCharge, 
      machineDetails, 
      status, 
      notes, 
      scheduledDate,
      conditionBefore,
      conditionAfter,
      otherPersonnel,
      nextServiceDate
    } = req.body;

    // Validate required fields
    if (!facility || !facility.name) {
      return res.status(400).json({ success: false, message: 'Facility name is required' });
    }
    if (!serviceType) {
      return res.status(400).json({ success: false, message: 'Service type is required' });
    }

    // Validate engineer if provided
    if (engineerInCharge && engineerInCharge._id) {
      const engineerExists = await User.findById(engineerInCharge._id).select('_id');
      if (!engineerExists) {
        return res.status(400).json({ success: false, message: 'Invalid engineer ID' });
      }
    }

    const payload = {
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      facility,
      machineId: req.body.machineId || undefined,
      serviceType,
      engineerInCharge,
      machineDetails,
      conditionBefore,
      conditionAfter,
      otherPersonnel: Array.isArray(otherPersonnel) ? otherPersonnel : (otherPersonnel ? [otherPersonnel] : []),
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      status: status || 'pending',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      notes,
      syncedAt: new Date(),
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    const service = new EngineeringService(payload);
    await service.save();

    // Populate userId and machineId for response
    await service.populate([
      { path: 'userId', select: 'firstName lastName email employeeId' },
      { path: 'machineId', select: 'model manufacturer serialNumber facility installedDate' }
    ]);

    res.status(201).json({ 
      success: true, 
      message: 'Service created successfully',
      data: service 
    });
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
      engineerId,
      status,
      startDate,
      endDate
    } = req.query;

    const query = {};
    
    if (serviceType) query.serviceType = serviceType;
    if (facilityName) query['facility.name'] = new RegExp(facilityName, 'i');
    if (facilityLocation) query['facility.location'] = new RegExp(facilityLocation, 'i');
    if (userId) query.userId = userId;
    if (engineerId) query['engineerInCharge._id'] = engineerId;
    if (status) query.status = status;

    // date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'firstName lastName email employeeId role' },
        { path: 'engineerInCharge._id', select: 'firstName lastName email employeeId phone' },
        { path: 'machineId', select: 'model manufacturer serialNumber facility installedDate' }
      ]
    };

    const results = await EngineeringService.paginate(query, options);
    
    res.json({ 
      success: true, 
      data: {
        docs: results.docs,
        totalDocs: results.totalDocs,
        totalPages: results.totalPages,
        page: results.page,
        limit: results.limit,
        hasNextPage: results.hasNextPage,
        hasPrevPage: results.hasPrevPage
      }
    });
  } catch (err) {
    logger.error('Get engineering services error:', err);
    next(err);
  }
};

export const getEngineeringServiceById = async (req, res, next) => {
  try {
    const service = await EngineeringService.findById(req.params.id)
      .populate('userId', 'firstName lastName email employeeId role')
      .populate('engineerInCharge._id', 'firstName lastName email employeeId phone')
      .populate('machineId', 'model manufacturer serialNumber facility installedDate lastServicedAt nextServiceDue');
      
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
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

// Get services by machine id (service history for a machine)
export const getServicesByMachine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid machine id' });
    }

    const query = { machineId: id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort: { date: -1 },
      populate: [
        { path: 'userId', select: 'firstName lastName email employeeId role' },
        { path: 'engineerInCharge._id', select: 'firstName lastName email employeeId phone' },
        { path: 'machineId', select: 'model manufacturer serialNumber facility installedDate' }
      ]
    };

    const results = await EngineeringService.paginate(query, options);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Get services by machine error:', err);
    next(err);
  }
};

export const assignServiceToEngineer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      engineerId, 
      engineerName, 
      engineerPhone, 
      scheduledDate, 
      facility, 
      activity, 
      notes, 
      location,
      status 
    } = req.body;

    const service = await EngineeringService.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Validate engineer if provided
    if (engineerId) {
      const engineer = await User.findById(engineerId).select('_id firstName lastName phone');
      if (!engineer) {
        return res.status(400).json({ success: false, message: 'Invalid engineer ID' });
      }
      
      service.engineerInCharge = {
        _id: engineer._id,
        name: engineerName || `${engineer.firstName} ${engineer.lastName}`,
        phone: engineerPhone || engineer.phone
      };
    } else if (engineerName || engineerPhone) {
      // Allow manual entry without user reference
      if (!service.engineerInCharge) service.engineerInCharge = {};
      if (engineerName) service.engineerInCharge.name = engineerName;
      if (engineerPhone) service.engineerInCharge.phone = engineerPhone;
    }

    if (scheduledDate) service.scheduledDate = new Date(scheduledDate);
    if (facility) service.facility = facility;
    if (activity) service.serviceType = activity;
    if (notes) service.notes = notes;
    if (location) service.facility.location = location;
    if (status) service.status = status;

    // Set status to assigned if engineer is assigned and status is still pending
    if (service.engineerInCharge && service.engineerInCharge._id && service.status === 'pending') {
      service.status = 'assigned';
    }

    service.metadata = service.metadata || {};
    service.metadata.assignedBy = req.user._id;
    service.metadata.assignedAt = new Date();

    await service.save();
    // Populate userId and machineId for response
    await service.populate([
      { path: 'userId', select: 'firstName lastName email employeeId' },
      { path: 'machineId', select: 'model manufacturer serialNumber facility installedDate' }
    ]);
    
    res.json({ 
      success: true, 
      message: 'Service assigned to engineer successfully', 
      data: service 
    });
  } catch (err) {
    logger.error('Assign service error:', err);
    next(err);
  }
};

// Update an existing service
export const updateEngineeringService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Prevent overwriting userId
    delete updates.userId;
    delete updates._id;
    delete updates.createdAt;

    // Handle engineerInCharge update
    if (updates.engineerInCharge && updates.engineerInCharge._id) {
      const engineer = await User.findById(updates.engineerInCharge._id).select('_id');
      if (!engineer) {
        return res.status(400).json({ success: false, message: 'Invalid engineer ID' });
      }
    }

    // Convert date strings
    if (updates.date) updates.date = new Date(updates.date);
    if (updates.scheduledDate) updates.scheduledDate = new Date(updates.scheduledDate);
    if (updates.nextServiceDate) updates.nextServiceDate = new Date(updates.nextServiceDate);

    // Handle otherPersonnel array
    if (updates.otherPersonnel && !Array.isArray(updates.otherPersonnel)) {
      updates.otherPersonnel = [updates.otherPersonnel];
    }

    const service = await EngineeringService.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    .populate([
      { path: 'userId', select: 'firstName lastName email employeeId role' },
      { path: 'engineerInCharge._id', select: 'firstName lastName email employeeId phone' },
      { path: 'machineId', select: 'model manufacturer serialNumber facility installedDate' }
    ]);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ 
      success: true, 
      message: 'Service updated successfully', 
      data: service 
    });
  } catch (err) {
    logger.error('Update service error:', err);
    next(err);
  }
};

// Bulk assign services to an engineer
export const bulkAssignServices = async (req, res, next) => {
  try {
    const { serviceIds, engineerId, engineerName, engineerPhone, scheduledDate, notes } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'serviceIds array is required' });
    }

    // Validate engineer
    let engineer = null;
    if (engineerId) {
      engineer = await User.findById(engineerId).select('_id firstName lastName phone');
      if (!engineer) {
        return res.status(400).json({ success: false, message: 'Invalid engineer ID' });
      }
    }

    const updatePayload = {
      status: 'assigned',
      'metadata.assignedBy': req.user._id,
      'metadata.assignedAt': new Date()
    };

    if (engineer) {
      updatePayload.engineerInCharge = {
        _id: engineer._id,
        name: engineerName || `${engineer.firstName} ${engineer.lastName}`,
        phone: engineerPhone || engineer.phone
      };
    } else if (engineerName || engineerPhone) {
      updatePayload.engineerInCharge = {
        name: engineerName,
        phone: engineerPhone
      };
    }

    if (scheduledDate) updatePayload.scheduledDate = new Date(scheduledDate);
    if (notes) updatePayload.notes = notes;

    const result = await EngineeringService.updateMany(
      { _id: { $in: serviceIds } },
      { $set: updatePayload }
    );

    res.json({ 
      success: true, 
      message: `${result.modifiedCount} service(s) assigned successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (err) {
    logger.error('Bulk assign services error:', err);
    next(err);
  }
};

// Delete a service
export const deleteEngineeringService = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = await EngineeringService.findByIdAndDelete(id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ 
      success: true, 
      message: 'Service deleted successfully' 
    });
  } catch (err) {
    logger.error('Delete service error:', err);
    next(err);
  }
};

// Get service statistics
export const getServiceStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate, engineerId } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    if (engineerId) matchStage['engineerInCharge._id'] = engineerId;

    const stats = await EngineeringService.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    // Count unique engineers
    const engineersCount = await EngineeringService.distinct('engineerInCharge._id', matchStage);

    res.json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        pending: stats[0]?.pending || 0,
        assigned: stats[0]?.assigned || 0,
        inProgress: stats[0]?.inProgress || 0,
        completed: stats[0]?.completed || 0,
        cancelled: stats[0]?.cancelled || 0,
        totalEngineers: engineersCount.filter(id => id).length
      }
    });
  } catch (err) {
    logger.error('Get service statistics error:', err);
    next(err);
  }
};
