import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createManufacturer, listManufacturers, updateManufacturer, deleteManufacturer } from '../controllers/manufacturerController.js';

const router = express.Router();

router.get('/', listManufacturers);

router.use(authenticate, authorize('admin'));
router.post('/', createManufacturer);
router.put('/:id', updateManufacturer);
router.delete('/:id', deleteManufacturer);

export default router;
