import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';
// Dummy model, replace with actual Equipment model if available
const Equipment = {
  find: async () => [{ _id: '1', name: 'X-Ray Machine', type: 'Diagnostic', status: 'available' }],
  findById: async (id) => ({ _id: id, name: 'X-Ray Machine', type: 'Diagnostic', status: 'available' }),
  create: async (data) => data,
  findByIdAndUpdate: async (id, data) => ({ ...data, _id: id }),
  findByIdAndDelete: async (id) => ({ _id: id })
};

const router = express.Router();

// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const equipment = await Equipment.find();
    res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('Get equipment error:', error);
    res.status(500).json({ success: false, message: 'Failed to get equipment' });
  }
});

// @route   GET /api/equipment/:id
// @desc    Get equipment by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('Get equipment by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to get equipment' });
  }
});

// @route   POST /api/equipment
// @desc    Add new equipment
// @access  Private (admin/manager)
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const newEquipment = await Equipment.create(req.body);
    res.status(201).json({ success: true, data: newEquipment });
  } catch (error) {
    logger.error('Create equipment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add equipment' });
  }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private (admin/manager)
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const updatedEquipment = await Equipment.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true, data: updatedEquipment });
  } catch (error) {
    logger.error('Update equipment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update equipment' });
  }
});

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Private (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Equipment deleted successfully' });
  } catch (error) {
    logger.error('Delete equipment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete equipment' });
  }
});

export default router;
