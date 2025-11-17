import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getUserVisitsAdmin,
  getVisitsSummary,
  getVisitByIdAdmin,
  getDailyVisitsActivities
} from '../../controllers/adminVisitsController.js';

const router = express.Router();

// Require admin
router.use(authenticate, authorize('admin'));

// Get daily visits activities for all sales team
router.get('/daily/activities', getDailyVisitsActivities);

// Paginated visits for a specific user
router.get('/user/:userId', getUserVisitsAdmin);

// Summary per user
router.get('/summary', getVisitsSummary);

// Single visit detail
router.get('/:id', getVisitByIdAdmin);

export default router;