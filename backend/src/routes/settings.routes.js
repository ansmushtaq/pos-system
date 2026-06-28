import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { get, update, verify, set, disable, passcodesStatus } from '../controllers/settings.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateSettingsValidator, verifyPasscodeValidator, setPasscodeValidator } from '../validators/settings.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const passcodeVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many passcode attempts, try again later', data: null, errors: null },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', verifyToken, get);
router.put('/', verifyToken, requireRole(ROLES.ADMIN), validate(updateSettingsValidator), update);
router.post('/passcode/verify', verifyToken, passcodeVerifyLimiter, validate(verifyPasscodeValidator), verify);
router.put('/passcode', verifyToken, requireRole(ROLES.ADMIN), validate(setPasscodeValidator), set);
router.delete('/passcode/:module', verifyToken, requireRole(ROLES.ADMIN), disable);
router.get('/passcodes/status', verifyToken, requireRole(ROLES.MANAGER), passcodesStatus);

export default router;
