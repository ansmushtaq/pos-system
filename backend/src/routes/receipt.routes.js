import { Router } from 'express';
import { param } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { ROLES } from '../config/constants.js';
import { getReceipt, printReceipt } from '../controllers/receipt.controller.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid sale ID')];

router.get('/:id/receipt', verifyToken, requireRole(ROLES.CASHIER), validate(idValidator), getReceipt);
router.get('/:id/receipt/print', verifyToken, requireRole(ROLES.CASHIER), validate(idValidator), printReceipt);

export default router;
