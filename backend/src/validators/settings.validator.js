import { body } from 'express-validator';
import { PASSCODE_MODULES } from '../config/constants.js';

export const updateSettingsValidator = [
  body('shopName').optional().isString(),
  body('shopType').optional().isString(),
  body('address').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail(),
  body('receiptHeader').optional().isString(),
  body('receiptFooter').optional().isString(),
  body('showProfitOnReceipt').optional().isBoolean(),
  body('currencySymbol').optional().isString(),
  body('taxLabel').optional().isString(),
  body('defaultTaxPercent').optional().isFloat({ min: 0 }),
  body('enableExpiryTracking').optional().isBoolean(),
  body('enablePrescriptionField').optional().isBoolean(),
  body('enableServiceItems').optional().isBoolean(),
];

export const setPasscodeValidator = [
  body('module').isIn(Object.values(PASSCODE_MODULES)).withMessage('Invalid passcode module'),
  body('pin').isString().matches(/^\d{4,6}$/).withMessage('PIN must be 4-6 digits'),
];

export const verifyPasscodeValidator = [
  body('module').isIn(Object.values(PASSCODE_MODULES)).withMessage('Invalid passcode module'),
  body('pin').isString().isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
];
