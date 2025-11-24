import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { adminGetAllPlanners, adminGetPlannerById } from '../../controllers/plannerController.js';

const router = express.Router();

// Admin: fetch all planners (supports pagination and optional filters)
router.get('/', authenticate, authorize('admin'), adminGetAllPlanners);

// Admin: fetch a single planner by ID
router.get('/:id', authenticate, authorize('admin'), adminGetPlannerById);

export default router;
