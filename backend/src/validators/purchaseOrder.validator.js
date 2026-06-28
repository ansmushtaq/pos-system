import { body } from 'express-validator';
import { PO_STATUSES } from '../config/constants.js';

export const createPOValidator = [
  body('vendorId').isInt({ min: 1 }).withMessage('Vendor is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('items.*.orderedQty').isFloat({ min: 0.001 }).withMessage('Ordered quantity must be > 0'),
  body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be >= 0'),
  body('notes').optional().isString(),
];

export const updatePOValidator = [
  body('vendorId').optional().isInt({ min: 1 }),
  body('notes').optional().isString(),
  body('status').optional().isIn([PO_STATUSES.DRAFT, PO_STATUSES.SENT, PO_STATUSES.CANCELLED]),
  body('orderedAt').optional().isISO8601().toDate(),
];

export const updatePOItemsValidator = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('items.*.orderedQty').isFloat({ min: 0.001 }).withMessage('Ordered quantity must be > 0'),
  body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be >= 0'),
];

export const receiveItemsValidator = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.itemId').isInt({ min: 1 }).withMessage('PO item ID is required'),
  body('items.*.receivedQty').isFloat({ min: 0.001 }).withMessage('Received quantity must be > 0'),
];
