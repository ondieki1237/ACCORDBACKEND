import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { adminGetAllPlanners } from '../../controllers/plannerController.js';

const router = express.Router();

// Admin: fetch all planners (supports pagination and optional filters)
router.get('/', authenticate, authorize('admin'), adminGetAllPlanners);

export default router;
