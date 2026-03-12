import express from 'express';
import {
  getTelesalesCallHistory,
  getTelesalesSummary
} from '../controllers/callLogController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get call history for facility
router.get('/history', getTelesalesCallHistory);

// Get telesales summary
router.get('/summary', getTelesalesSummary);

export default router;
