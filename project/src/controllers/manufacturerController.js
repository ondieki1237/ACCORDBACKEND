import Manufacturer from '../models/Manufacturer.js';
import logger from '../utils/logger.js';

export const createManufacturer = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const m = new Manufacturer({ name, description, createdBy: req.user._id });
    await m.save();
    return res.status(201).json({ success: true, data: m });
  } catch (error) {
    logger.error('Create manufacturer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create manufacturer' });
  }
};

export const listManufacturers = async (req, res) => {
  try {
    const items = await Manufacturer.find({}).sort('name');
    return res.json({ success: true, data: items });
  } catch (error) {
    logger.error('List manufacturers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list manufacturers' });
  }
};

export const updateManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const m = await Manufacturer.findByIdAndUpdate(id, updates, { new: true });
    if (!m) return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    return res.json({ success: true, data: m });
  } catch (error) {
    logger.error('Update manufacturer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update manufacturer' });
  }
};

export const deleteManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const m = await Manufacturer.findById(id);
    if (!m) return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    await m.remove();
    return res.json({ success: true, message: 'Manufacturer deleted' });
  } catch (error) {
    logger.error('Delete manufacturer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete manufacturer' });
  }
};
