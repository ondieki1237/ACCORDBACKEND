import express from 'express';
import {
  createCallLog,
  getCallLogs,
  getCallLogById,
  updateCallLog,
  deleteCallLog,
  getCallStatistics,
  getUpcomingFollowUps,
  getFolderTree
} from '../controllers/callLogController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get folder tree structure
router.get('/folder-tree', getFolderTree);

// Get statistics
router.get('/statistics', getCallStatistics);

// Get upcoming follow-ups
router.get('/follow-ups', getUpcomingFollowUps);

// CRUD operations
router.post('/', createCallLog);
router.get('/', getCallLogs);
router.get('/:id', getCallLogById);
router.put('/:id', updateCallLog);
router.delete('/:id', deleteCallLog);

export default router;
