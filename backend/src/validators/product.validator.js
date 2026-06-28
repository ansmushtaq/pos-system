import { body } from 'express-validator';
import { UNITS } from '../config/constants.js';

export const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('categoryId').isInt({ min: 1 }).withMessage('Category is required'),
  body('unit').optional().isIn(Object.values(UNITS)).withMessage('Invalid unit'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be >= 0'),
  body('purchaseTaxPercent').optional().isFloat({ min: 0 }).withMessage('Purchase tax % must be >= 0'),
  body('salePrice').isFloat({ min: 0 }).withMessage('Sale price must be >= 0'),
  body('barcode').optional({ values: 'falsy' }).isString(),
  body('description').optional({ values: 'falsy' }).isString(),
  body('vendorId').optional({ values: 'falsy' }).isInt(),
  body('reorderLevel').optional().isFloat({ min: 0 }),
  body('isService').optional().isBoolean(),
  body('expiryTracking').optional().isBoolean(),
  body('requiresPrescription').optional().isBoolean(),
];

export const updateProductValidator = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('categoryId').optional().isInt({ min: 1 }),
  body('unit').optional().isIn(Object.values(UNITS)).withMessage('Invalid unit'),
  body('purchasePrice').optional().isFloat({ min: 0 }).withMessage('Purchase price must be >= 0'),
  body('purchaseTaxPercent').optional().isFloat({ min: 0 }).withMessage('Purchase tax % must be >= 0'),
  body('salePrice').optional().isFloat({ min: 0 }).withMessage('Sale price must be >= 0'),
  body('barcode').optional({ values: 'falsy' }).isString(),
  body('description').optional({ values: 'falsy' }).isString(),
  body('vendorId').optional({ values: 'falsy' }).isInt(),
  body('isActive').optional().isBoolean(),
];

export const updatePriceValidator = [
  body('purchasePrice').optional().isFloat({ min: 0 }).withMessage('Purchase price must be >= 0'),
  body('purchaseTaxPercent').optional().isFloat({ min: 0 }).withMessage('Purchase tax % must be >= 0'),
  body('salePrice').optional().isFloat({ min: 0 }).withMessage('Sale price must be >= 0'),
  body('changeReason').optional({ values: 'falsy' }).isString(),
];

