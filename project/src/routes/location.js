import express from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import { trackLocation, getMyLocationHistory } from '../controllers/locationController.js';

const router = express.Router();

// Track location data (supports batch/offline uploads)
// If authenticated, uses JWT user. Otherwise requires userId in body.
router.post('/track', optionalAuth, trackLocation);

// Get authenticated user's location history
router.get('/history', authenticate, getMyLocationHistory);

export default router;
