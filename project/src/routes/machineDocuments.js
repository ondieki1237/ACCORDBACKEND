import express from 'express';
import upload from '../middleware/upload.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMachineDocument, listMachineDocuments, getMachineDocument, deleteMachineDocument } from '../controllers/machineDocumentController.js';

const router = express.Router();

// Helper: only run multer for multipart/form-data requests
const conditionalUpload = (req, res, next) => {
	const ct = req.headers['content-type'] || '';
	if (ct.includes('multipart/form-data')) {
		return upload.single('file')(req, res, next);
	}
	return next();
};

// Public listing is allowed for authenticated users (list may be used in admin UI too)
router.get('/', authenticate, listMachineDocuments);
router.get('/:id', authenticate, getMachineDocument);

// Admin-only create/delete. Use conditionalUpload so JSON link posts are accepted without file field.
// Dedicated JSON/link creation endpoint used by the frontend
// Accept either JSON bodies or multipart/form-data (FormData) so frontends that post FormData without a file still work.
router.post('/link', authenticate, authorize('admin'), conditionalUpload, uploadMachineDocument);

// Admin-only create/delete. Use conditionalUpload so multipart file uploads still work.
router.post('/', authenticate, authorize('admin'), conditionalUpload, uploadMachineDocument);
router.delete('/:id', authenticate, authorize('admin'), deleteMachineDocument);

export default router;