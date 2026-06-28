import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, refresh, me } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginValidator } from '../validators/auth.validator.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    data: null,
    errors: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/login', loginLimiter, validate(loginValidator), login);
router.post('/refresh', refresh);
router.get('/me', verifyToken, me);

export default router;
