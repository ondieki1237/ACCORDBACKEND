import express from 'express';
import { createUpdate, listUpdates, getUpdate, updateUpdate, deleteUpdate, checkForUpdate, syncVersionUpdate } from '../controllers/appUpdateController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public check endpoint (POST or GET)
router.post('/check', checkForUpdate);
router.get('/check', checkForUpdate);

// Admin CRUD
router.use(authenticate);
router.get('/', authorize('admin'), listUpdates);
router.post('/', authorize('admin'), createUpdate);
router.post('/sync-version', authorize('admin'), syncVersionUpdate);
router.get('/:id', authorize('admin'), getUpdate);
router.put('/:id', authorize('admin'), updateUpdate);
router.delete('/:id', authorize('admin'), deleteUpdate);

export default router;
