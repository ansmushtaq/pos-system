import { body } from 'express-validator';

export const generateEODValidator = [
  body('openingCash').isFloat({ min: 0 }).withMessage('Opening cash must be a positive number'),
  body('actualClosingCash').isFloat({ min: 0 }).withMessage('Actual closing cash must be a positive number'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];
