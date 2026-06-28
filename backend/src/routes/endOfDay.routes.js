import { Router } from 'express';
import { param } from 'express-validator';
import { generate, list, getById, today } from '../controllers/endOfDay.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { generateEODValidator } from '../validators/endOfDay.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ID')];

router.post('/', verifyToken, requireRole(ROLES.MANAGER), validate(generateEODValidator), generate);
router.get('/', verifyToken, requireRole(ROLES.MANAGER), list);
router.get('/today', verifyToken, requireRole(ROLES.MANAGER), today);
router.get('/:id', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), getById);

export default router;
