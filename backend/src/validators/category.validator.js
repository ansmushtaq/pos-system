import { body } from 'express-validator';

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('parentCategoryId').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Invalid parent category ID'),
];
