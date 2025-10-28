import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { adminGetLocationHistory } from '../../controllers/locationController.js';

const router = express.Router();

// Admin: get location history for all users (supports filters)
router.get('/', authenticate, authorize('admin'), adminGetLocationHistory);

export default router;
