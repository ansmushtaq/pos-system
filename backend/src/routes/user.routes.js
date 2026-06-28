import { Router } from 'express';
import { param } from 'express-validator';
import { list, getById, create, update, remove, clockInHandler, clockOutHandler, shiftSummary } from '../controllers/user.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserValidator, updateUserValidator } from '../validators/user.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ID')];

router.get('/', verifyToken, requireRole(ROLES.MANAGER), list);
router.get('/:id', verifyToken, validate(idValidator), getById);
router.post('/', verifyToken, requireRole(ROLES.ADMIN), validate(createUserValidator), create);
router.patch('/:id', verifyToken, requireRole(ROLES.ADMIN), validate(idValidator), validate(updateUserValidator), update);
router.delete('/:id', verifyToken, requireRole(ROLES.ADMIN), validate(idValidator), remove);
router.post('/:id/clock-in', verifyToken, validate(idValidator), clockInHandler);
router.post('/:id/clock-out', verifyToken, validate(idValidator), clockOutHandler);
router.get('/:id/shift-summary', verifyToken, validate(idValidator), shiftSummary);

export default router;
