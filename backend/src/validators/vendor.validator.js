import { body } from 'express-validator';

export const createVendorValidator = [
  body('name').trim().notEmpty().withMessage('Vendor name is required'),
  body('contactName').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().isString(),
];

export const updateVendorValidator = [
  body('name').optional().trim().notEmpty().withMessage('Vendor name cannot be empty'),
  body('contactName').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().isString(),
  body('isActive').optional().isBoolean(),
];
