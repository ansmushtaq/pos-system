import { Router } from 'express';
import { param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { create, list, getById, voidSaleOrder, returnSaleItems } from '../controllers/sale.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSaleValidator, voidSaleValidator, returnItemsValidator } from '../validators/sale.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ID')];

const createSaleLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many sale requests, slow down', data: null, errors: null },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', verifyToken, list);
router.post('/', verifyToken, requireRole(ROLES.CASHIER), createSaleLimiter, validate(createSaleValidator), create);
router.get('/:id', verifyToken, validate(idValidator), getById);
router.post('/:id/void', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(voidSaleValidator), voidSaleOrder);
router.post('/:id/return', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(returnItemsValidator), returnSaleItems);

export default router;
