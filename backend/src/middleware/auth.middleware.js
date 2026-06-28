import jwt from 'jsonwebtoken';
import { ROLES } from '../config/constants.js';
import { error } from '../utils/apiResponse.js';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, 'No token provided', 401);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  const hierarchy = [ROLES.VIEWER, ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN];
  const minLevel = Math.min(...roles.map(r => hierarchy.indexOf(r)));
  if (hierarchy.indexOf(req.user.role) < minLevel)
    return error(res, 'Forbidden — insufficient role', 403);
  next();
};
