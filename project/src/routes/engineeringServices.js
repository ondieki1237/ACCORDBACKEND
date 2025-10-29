import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  createEngineeringService, 
  getEngineeringServices, 
  getEngineeringServiceById, 
  getServicesByEngineer, 
  getServicesByFacility,
  assignServiceToEngineer,
  updateEngineeringService,
  bulkAssignServices,
  deleteEngineeringService,
  getServiceStatistics
} from '../controllers/engineeringServiceController.js';

const router = express.Router();

// Get service statistics (admin/manager only)
router.get('/statistics', authenticate, authorize('admin', 'manager'), getServiceStatistics);

// Get services for the currently authenticated user
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    // Ensure the query filters include the current user's id
    req.query.userId = req.user._id.toString();
    return getEngineeringServices(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get services by engineer id (use query param engineerId)
router.get('/by-engineer/:engineerId', authenticate, async (req, res, next) => {
  try {
    const { engineerId } = req.params;
    // Allow admin/manager or the engineer themselves
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== engineerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return getServicesByEngineer(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get services for a facility (search by name/location via query)
router.get('/by-facility', authenticate, getServicesByFacility);

// List engineering services (admin/manager can view all, others their own only)
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Allow admin/manager to pass filters for all users; others get only their records
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      req.query.userId = req.user._id.toString();
    }
    return getEngineeringServices(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Create a new engineering service
router.post('/', authenticate, createEngineeringService);

// Bulk assign services (admin/manager only)
router.post('/bulk-assign', authenticate, authorize('admin', 'manager'), bulkAssignServices);

// Get specific service by id
router.get('/:id', authenticate, getEngineeringServiceById);

// Update a service (admin/manager only)
router.put('/:id', authenticate, authorize('admin', 'manager'), updateEngineeringService);

// Assign a service to an engineer (admin/manager only)
router.put('/:id/assign', authenticate, authorize('admin', 'manager'), assignServiceToEngineer);

// Delete a service (admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteEngineeringService);

export default router;
