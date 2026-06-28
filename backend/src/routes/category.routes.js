import { Router } from 'express';
import { param } from 'express-validator';
import { list, getById, create, update, remove } from '../controllers/category.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { categoryValidator } from '../validators/category.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ID')];

router.get('/', verifyToken, list);
router.get('/:id', verifyToken, validate(idValidator), getById);
router.post('/', verifyToken, requireRole(ROLES.MANAGER), validate(categoryValidator), create);
router.patch('/:id', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(categoryValidator), update);
router.delete('/:id', verifyToken, requireRole(ROLES.ADMIN), validate(idValidator), remove);

export default router;
