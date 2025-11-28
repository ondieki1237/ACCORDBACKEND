import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createPricing,
  getPricings,
  updatePricing,
  deletePricing,
  getPricingById
} from '../controllers/engineeringPricingController.js';

const router = express.Router();

// Create pricing (engineers, managers, admins)
router.post('/', authenticate, authorize('admin', 'manager', 'engineer'), createPricing);

// List / filter pricing records (authenticated)
router.get('/', authenticate, getPricings);

// Get single pricing
router.get('/:pricingId', authenticate, getPricingById);

// Update pricing (admin/manager)
router.put('/:pricingId', authenticate, authorize('admin', 'manager'), updatePricing);

// Delete pricing (admin/manager)
router.delete('/:pricingId', authenticate, authorize('admin', 'manager'), deletePricing);

export default router;
