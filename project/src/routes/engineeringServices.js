import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createEngineeringService, getEngineeringServices, getEngineeringServiceById, getServicesByEngineer, getServicesByFacility } from '../controllers/engineeringServiceController.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Create a new engineering service (requires authentication)
router.post('/', authenticate, createEngineeringService);

// List engineering services (admin/manager can view all, others their own only)
router.get('/', authenticate, async (req, res, next) => {
  try {
    // allow admin/manager to pass filters for all users; others get only their records
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      req.query.userId = req.user._id.toString();
    }
    return getEngineeringServices(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get specific service by id
router.get('/:id', authenticate, getEngineeringServiceById);

// Get services by engineer id (admin/manager or the engineer themself)
router.get('/engineer/:engineerId', authenticate, async (req, res, next) => {
  try {
    const { engineerId } = req.params;
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== engineerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return getServicesByEngineer(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get services for a facility (search by name/location via query)
router.get('/facility', authenticate, async (req, res, next) => {
  try {
    // any authenticated user can view facility-level records, but you can restrict if needed
    return getServicesByFacility(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Assign a service to an engineer (admin/manager only)
router.post('/:id/assign', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    return assignServiceToEngineer(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get services for the currently authenticated user
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    // Ensure the query filters include the current user's id so pagination/filtering works
    req.query.userId = req.user._id.toString();
    return getEngineeringServices(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
