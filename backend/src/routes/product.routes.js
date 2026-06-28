import { Router } from 'express';
import { param } from 'express-validator';
import { list, getById, create, update, updatePrice, remove, priceHistory } from '../controllers/product.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createProductValidator, updateProductValidator, updatePriceValidator } from '../validators/product.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ID')];

router.get('/', verifyToken, list);
router.get('/:id', verifyToken, validate(idValidator), getById);
router.post('/', verifyToken, requireRole(ROLES.MANAGER), validate(createProductValidator), create);
router.patch('/:id', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(updateProductValidator), update);
router.put('/:id/price', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(updatePriceValidator), updatePrice);
router.delete('/:id', verifyToken, requireRole(ROLES.ADMIN), validate(idValidator), remove);
router.get('/:id/price-history', verifyToken, validate(idValidator), priceHistory);

export default router;
