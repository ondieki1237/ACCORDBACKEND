import express from 'express';
import MachineDocument from '../models/MachineDocument.js';

const router = express.Router();

// Public endpoint: list active link documents for sales
router.get('/', async (req, res) => {
  try {
    const docs = await MachineDocument.find({ type: 'link', isActive: true })
      .select('title linkUrl categoryId manufacturerId uploadedBy createdAt')
      .populate('categoryId', 'name')
      .populate('manufacturerId', 'name')
      .populate('uploadedBy', 'firstName lastName email');
    return res.json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list documents' });
  }
});

export default router;
