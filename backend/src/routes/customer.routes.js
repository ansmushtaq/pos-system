import { Router } from 'express';
import { param } from 'express-validator';
import { list, getById, create, update, remove, payCreditHandler, creditHistory } from '../controllers/customer.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCustomerValidator, updateCustomerValidator, payCreditValidator } from '../validators/customer.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ID')];

router.get('/', verifyToken, list);
router.get('/:id', verifyToken, validate(idValidator), getById);
router.post('/', verifyToken, requireRole(ROLES.MANAGER), validate(createCustomerValidator), create);
router.patch('/:id', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(updateCustomerValidator), update);
router.delete('/:id', verifyToken, requireRole(ROLES.ADMIN), validate(idValidator), remove);
router.post('/:id/credit/pay', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(payCreditValidator), payCreditHandler);
router.get('/:id/credit-history', verifyToken, validate(idValidator), creditHistory);

export default router;
