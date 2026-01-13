import express from 'express';
import {
  getCallLogs,
  getCallLogById,
  updateCallLog,
  deleteCallLog,
  getCallStatistics,
  getFolderTree
} from '../../controllers/callLogController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin/manager role
router.use(authenticate);
router.use(authorize('admin', 'manager'));

// Get folder tree for all users
router.get('/folder-tree', getFolderTree);

// Get all call logs (admin can see all)
router.get('/', getCallLogs);

// Get statistics
router.get('/statistics', getCallStatistics);

// Get specific call log
router.get('/:id', getCallLogById);

// Update call log
router.put('/:id', updateCallLog);

// Delete call log
router.delete('/:id', deleteCallLog);

export default router;
