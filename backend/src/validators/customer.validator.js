import { body } from 'express-validator';

export const createCustomerValidator = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().isString(),
];

export const updateCustomerValidator = [
  body('name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().isString(),
  body('isActive').optional().isBoolean(),
];

export const payCreditValidator = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('note').optional().isString(),
];
