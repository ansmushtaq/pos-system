import { body } from 'express-validator';
import { ROLES } from '../config/constants.js';

export const createUserValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn([ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.VIEWER]).withMessage('Invalid role'),
  body('phone').optional().isString(),
];

export const updateUserValidator = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('username').optional().trim().notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn([ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.VIEWER]).withMessage('Invalid role'),
  body('phone').optional().isString(),
  body('isActive').optional().isBoolean(),
];
