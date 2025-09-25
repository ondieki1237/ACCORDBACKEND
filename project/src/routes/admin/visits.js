import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getUserVisitsAdmin,
  getVisitsSummary,
  getVisitByIdAdmin
} from '../../controllers/adminVisitsController.js';

const router = express.Router();

// Require admin
router.use(authenticate, authorize('admin'));

// Paginated visits for a specific user
router.get('/user/:userId', getUserVisitsAdmin);

// Summary per user
router.get('/summary', getVisitsSummary);

// Single visit detail
router.get('/:id', getVisitByIdAdmin);

export default router;