import { Router } from 'express';
import { salesSummary, topProducts, profitBySeller, stockValuation } from '../controllers/report.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/sales-summary', verifyToken, requireRole(ROLES.MANAGER), salesSummary);
router.get('/top-products', verifyToken, requireRole(ROLES.MANAGER), topProducts);
router.get('/profit-by-seller', verifyToken, requireRole(ROLES.MANAGER), profitBySeller);
router.get('/stock-valuation', verifyToken, requireRole(ROLES.MANAGER), stockValuation);

export default router;
