import express from 'express';
import {
  getTelesalesCallHistory,
  getTelesalesSummary
} from '../../controllers/callLogController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin/manager role
router.use(authenticate);
router.use(authorize('admin', 'manager'));

// Get call history for facility (admin can see all)
router.get('/history', getTelesalesCallHistory);

// Get telesales summary (admin can see all)
router.get('/summary', getTelesalesSummary);

export default router;
