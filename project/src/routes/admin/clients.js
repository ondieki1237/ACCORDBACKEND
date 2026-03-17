import express from 'express';
import Client from '../../models/Client.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Create new client (WITHOUT machine)
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Handle both flat and nested payload structures
    const {
      facilityName: flatFacilityName,
      location: flatLocation,
      phoneNumber: flatPhoneNumber,
      role: flatRole
    } = req.body;

    // Extract values from either flat or nested structure
    const name = flatFacilityName || req.body.facility?.name;
    const location = flatLocation || req.body.facility?.location;
    const contactPersonName = (typeof req.body.contactPerson === 'string' ? req.body.contactPerson : req.body.contactPerson?.name);
    const phoneNumber = flatPhoneNumber || req.body.contactPerson?.phone;
    const role = flatRole || req.body.contactPerson?.role;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client name is required'
      });
    }

    if (!contactPersonName || !contactPersonName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Contact person name is required'
      });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Create client
    const client = new Client({
      name: name.trim(),
      location: location?.trim() || '',
      contactPerson: {
        name: contactPersonName.trim(),
        phone: phoneNumber.trim(),
        role: role?.trim() || 'Contact'
      },
      status: 'active',
      type: 'clinic',
      metadata: {
        createdBy: req.user._id
      }
    });

    await client.save();

    logger.info('Client created', {
      clientId: client._id,
      name: name,
      userId: req.user._id,
      userEmail: req.user.email
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });
  } catch (error) {
    logger.error('Create client error:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?._id
    });

    // Handle duplicate key error (client name already exists)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Client with this ${field} already exists`,
        field
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error.message
    });
  }
});

// Get all clients
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contactPerson.name': { $regex: search, $options: 'i' } },
        { 'contactPerson.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('metadata.createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: clients,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error('Get clients error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get client by ID
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('metadata.createdBy', 'firstName lastName email');

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, data: client });
  } catch (err) {
    logger.error('Get client error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update client
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const {
      name,
      location,
      contactPerson,
      status,
      type
    } = req.body;

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    if (name) client.name = name.trim();
    if (location) client.location = location.trim();
    if (contactPerson) {
      client.contactPerson = {
        name: contactPerson.name?.trim() || client.contactPerson.name,
        phone: contactPerson.phone?.trim() || client.contactPerson.phone,
        role: contactPerson.role?.trim() || client.contactPerson.role
      };
    }
    if (status) client.status = status;
    if (type) client.type = type;

    await client.save();

    logger.info('Client updated', {
      clientId: client._id,
      userId: req.user._id
    });

    res.json({ success: true, message: 'Client updated', data: client });
  } catch (err) {
    logger.error('Update client error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete client
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    logger.info('Client deleted', {
      clientId: client._id,
      userId: req.user._id
    });

    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    logger.error('Delete client error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
