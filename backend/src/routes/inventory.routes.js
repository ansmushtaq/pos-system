import { Router } from 'express';
import { param } from 'express-validator';
import { list, getByProductId, movements, allMovements, adjust } from '../controllers/inventory.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { adjustStockValidator } from '../validators/inventory.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const productIdValidator = [param('productId').isInt({ min: 1 }).withMessage('Invalid product ID')];

router.get('/', verifyToken, list);
router.get('/movements', verifyToken, allMovements);
router.get('/:productId', verifyToken, validate(productIdValidator), getByProductId);
router.get('/:productId/movements', verifyToken, validate(productIdValidator), movements);
router.post('/adjust', verifyToken, requireRole(ROLES.MANAGER), validate(adjustStockValidator), adjust);

export default router;
