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

// ============================================
// ADMIN/MANAGER ONLY ROUTES
// ============================================

// Get service statistics (admin/manager only)
router.get('/statistics', authenticate, authorize('admin', 'manager'), getServiceStatistics);

// Bulk assign services (admin/manager only)
router.post('/bulk-assign', authenticate, authorize('admin', 'manager'), bulkAssignServices);

// Create a new engineering service (admin/manager only)
router.post('/', authenticate, authorize('admin', 'manager'), createEngineeringService);

// Update a service (admin/manager can update any, engineers can only update their own)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    // Admin/manager can update anything
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return updateEngineeringService(req, res, next);
    }
    
    // Engineers can only update services assigned to them and only specific fields
    const EngineeringService = (await import('../models/EngineeringService.js')).default;
    const service = await EngineeringService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    // Check if engineer owns this service
    if (service.engineerInCharge?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update services assigned to you' 
      });
    }
    
    // Engineers can only update these fields
    const allowedFields = ['status', 'conditionBefore', 'conditionAfter', 'notes', 'otherPersonnel', 'nextServiceDate'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Replace req.body with filtered updates
    req.body = updates;
    
    return updateEngineeringService(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Assign a service to an engineer (admin/manager only)
router.put('/:id/assign', authenticate, authorize('admin', 'manager'), assignServiceToEngineer);

// Delete a service (admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteEngineeringService);

// ============================================
// ENGINEER-SPECIFIC ROUTES
// ============================================

// Get services for the currently authenticated engineer
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    // Only engineers and staff can use this endpoint
    if (req.user.role !== 'engineer' && req.user.role !== 'sales') {
      return res.status(403).json({ 
        success: false, 
        message: 'This endpoint is for engineers only' 
      });
    }
    
    // Filter by engineer ID automatically
    req.query.engineerId = req.user._id.toString();
    return getEngineeringServices(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get services by engineer id (engineer can only view their own, admin/manager can view anyone's)
router.get('/by-engineer/:engineerId', authenticate, async (req, res, next) => {
  try {
    const { engineerId } = req.params;
    
    // Engineers can only view their own services
    if (req.user.role === 'engineer' && req.user._id.toString() !== engineerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your own services' 
      });
    }
    
    // Admin/manager can view anyone's services
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== engineerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    return getServicesByEngineer(req, res, next);
  } catch (err) {
    next(err);
  }
});

// ============================================
// SHARED ROUTES (with role-based filtering)
// ============================================

// Get services for a facility (all authenticated users)
router.get('/by-facility', authenticate, getServicesByFacility);

// List engineering services (role-based access)
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Admin/manager can view all services with any filter
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return getEngineeringServices(req, res, next);
    }
    
    // Engineers can only view services assigned to them
    if (req.user.role === 'engineer') {
      req.query.engineerId = req.user._id.toString();
      return getEngineeringServices(req, res, next);
    }
    
    // Sales can only view services they created
    if (req.user.role === 'sales') {
      req.query.userId = req.user._id.toString();
      return getEngineeringServices(req, res, next);
    }
    
    // Default: deny access
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied' 
    });
  } catch (err) {
    next(err);
  }
});

// Get specific service by id (role-based access)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const EngineeringService = (await import('../models/EngineeringService.js')).default;
    const service = await EngineeringService.findById(req.params.id)
      .populate('userId', 'firstName lastName email employeeId role')
      .populate('engineerInCharge._id', 'firstName lastName email employeeId phone');
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    // Admin/manager can view any service
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return res.json({ success: true, data: service });
    }
    
    // Engineers can only view services assigned to them
    if (req.user.role === 'engineer') {
      if (service.engineerInCharge?._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only view services assigned to you' 
        });
      }
      return res.json({ success: true, data: service });
    }
    
    // Sales can only view services they created
    if (req.user.role === 'sales') {
      if (service.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only view services you created' 
        });
      }
      return res.json({ success: true, data: service });
    }
    
    // Default: deny
    return res.status(403).json({ success: false, message: 'Access denied' });
  } catch (err) {
    next(err);
  }
});

export default router;
