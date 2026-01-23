import EngineeringRequest from '../models/EngineeringRequest.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Public: create a new engineering request (no auth required)
export const createEngineeringRequest = async (req, res) => {
  try {
    const { requestType, facility, contact, machine, expectedDate, notes } = req.body;

    // Basic validation
    if (!requestType || !facility || !facility.name || !facility.location || !contact || !contact.name || !contact.role || !contact.phone || !machine || !machine.name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const reqDoc = new EngineeringRequest({
      requestType,
      facility,
      contact,
      machine,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      notes: notes || null
    });

    await reqDoc.save();

    // Keep response minimal for public clients
    res.status(201).json({ success: true, message: 'Request submitted', data: { id: reqDoc._id, status: reqDoc.status } });
  } catch (error) {
    logger.error('Create engineering request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit request', error: error.message });
  }
};

// Admin: list requests with optional filters
export const listEngineeringRequests = async (req, res) => {
  try {
    const { page = 1, limit = 30, status, requestType, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;
    if (search) query.$text = { $search: search };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    // Use mongoose paginate if available, else simple find
    if (typeof EngineeringRequest.paginate === 'function') {
      const results = await EngineeringRequest.paginate(query, options);
      return res.json({ success: true, data: results });
    }

    const docs = await EngineeringRequest.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const total = await EngineeringRequest.countDocuments(query);
    res.json({ success: true, data: docs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    logger.error('List engineering requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to list requests' });
  }
};

// Admin: get single request
export const getEngineeringRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const doc = await EngineeringRequest.findById(id).populate('assignedEngineer', 'firstName lastName email');
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    logger.error('Get engineering request error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch request' });
  }
};

// Admin: assign engineer
export const assignEngineer = async (req, res) => {
  try {
    const { id } = req.params;
    const { engineerId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(engineerId)) return res.status(400).json({ success: false, message: 'Invalid id(s)' });

    const doc = await EngineeringRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });

    doc.assignedEngineer = engineerId;
    doc.status = 'assigned';
    await doc.save();

    res.json({ success: true, message: 'Engineer assigned', data: doc });
  } catch (error) {
    logger.error('Assign engineer error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign engineer' });
  }
};

// Admin: update status
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    if (!['pending', 'assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const doc = await EngineeringRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });

    doc.status = status;
    await doc.save();

    res.json({ success: true, message: 'Status updated', data: doc });
  } catch (error) {
    logger.error('Update request status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// Admin: delete request
export const deleteEngineeringRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const doc = await EngineeringRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });

    await doc.remove();
    res.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    logger.error('Delete engineering request error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete request' });
  }
};
