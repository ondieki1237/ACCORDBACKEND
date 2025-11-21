import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { searchFacilities, getFacilityById, createFacility } from '../controllers/facilitiesController.js';

const router = express.Router();

// Public search (optional auth) - allow optionalAuth pattern but here keep authenticate optional
router.get('/', authenticate, searchFacilities);

router.get('/:id', authenticate, getFacilityById);

// Admin create facility (or import)
router.post('/', authenticate, authorize('admin', 'manager'), createFacility);

export default router;
