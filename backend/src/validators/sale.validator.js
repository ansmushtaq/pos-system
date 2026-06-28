import { body } from 'express-validator';
import { PAYMENT_METHODS } from '../config/constants.js';

export const createSaleValidator = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
  body('items.*.discount').optional().isFloat({ min: 0 }).withMessage('Discount must be 0 or greater'),
  body('paymentMethod')
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage('Valid payment method is required'),
  body('amountTendered').optional().isFloat({ min: 0 }).withMessage('Amount tendered must be 0 or greater'),
  body('customerId').optional().isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),
  body('customerName').optional().isString().trim(),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be 0 or greater'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be 0 or greater'),
  body('notes').optional().isString().trim(),
];

export const voidSaleValidator = [
  body('voidReason').trim().notEmpty().withMessage('Void reason is required'),
];

export const returnItemsValidator = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.saleOrderItemId').isInt({ min: 1 }).withMessage('Valid sale order item ID is required'),
  body('items.*.returnQty').isFloat({ min: 0.01 }).withMessage('Return quantity must be greater than 0'),
  body('returnReason').optional().trim().isString(),
];
