import { Router } from 'express';
import { param } from 'express-validator';
import {
  list,
  getById,
  create,
  update,
  updateItems,
  remove,
  receive,
} from '../controllers/purchaseOrder.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPOValidator,
  updatePOValidator,
  updatePOItemsValidator,
  receiveItemsValidator,
} from '../validators/purchaseOrder.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ID')];

router.get('/', verifyToken, list);
router.get('/:id', verifyToken, validate(idValidator), getById);
router.post('/', verifyToken, requireRole(ROLES.MANAGER), validate(createPOValidator), create);
router.patch('/:id', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(updatePOValidator), update);
router.put('/:id/items', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(updatePOItemsValidator), updateItems);
router.post('/:id/receive', verifyToken, requireRole(ROLES.MANAGER), validate(idValidator), validate(receiveItemsValidator), receive);
router.delete('/:id', verifyToken, requireRole(ROLES.ADMIN), validate(idValidator), remove);

export default router;
