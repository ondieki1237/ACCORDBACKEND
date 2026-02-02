import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createCategory, listCategories, updateCategory, deleteCategory } from '../controllers/documentCategoryController.js';

const router = express.Router();

router.get('/', listCategories);

router.use(authenticate, authorize('admin'));
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
