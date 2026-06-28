import { body } from 'express-validator';
import { MOVEMENT_TYPES } from '../config/constants.js';

export const adjustStockValidator = [
  body('productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('movementType')
    .isIn([MOVEMENT_TYPES.ADJUSTMENT_IN, MOVEMENT_TYPES.ADJUSTMENT_OUT])
    .withMessage('Movement type must be ADJUSTMENT_IN or ADJUSTMENT_OUT'),
  body('quantity').isFloat({ min: 0.001 }).withMessage('Quantity must be greater than 0'),
  body('notes').optional({ values: 'falsy' }).isString().withMessage('Notes must be a string'),
];
