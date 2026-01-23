import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  listEngineeringRequests,
  getEngineeringRequest,
  assignEngineer,
  updateRequestStatus,
  deleteEngineeringRequest
} from '../../controllers/engineeringRequestController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/', listEngineeringRequests);
router.get('/:id', getEngineeringRequest);
router.put('/:id/assign', assignEngineer);
router.put('/:id/status', updateRequestStatus);
router.delete('/:id', deleteEngineeringRequest);

export default router;
