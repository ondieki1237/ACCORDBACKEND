import DocumentCategory from '../models/DocumentCategory.js';
import logger from '../utils/logger.js';

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const cat = new DocumentCategory({ name, description, createdBy: req.user._id });
    await cat.save();
    return res.status(201).json({ success: true, data: cat });
  } catch (error) {
    logger.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

export const listCategories = async (req, res) => {
  try {
    const cats = await DocumentCategory.find({}).sort('name');
    return res.json({ success: true, data: cats });
  } catch (error) {
    logger.error('List categories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list categories' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const cat = await DocumentCategory.findByIdAndUpdate(id, updates, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    return res.json({ success: true, data: cat });
  } catch (error) {
    logger.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await DocumentCategory.findById(id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    await cat.remove();
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    logger.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};
