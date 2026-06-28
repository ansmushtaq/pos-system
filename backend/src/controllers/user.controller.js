import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  softDeleteUser,
  clockIn,
  clockOut,
  getShiftSummary,
} from '../services/user.service.js';
import { ROLES } from '../config/constants.js';
import { success, paginated, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  VALIDATION_ERROR: 400,
  P2002: 409,
  P2025: 404,
  USER_NOT_FOUND: 404,
  USER_INACTIVE: 400,
  ALREADY_ON_SHIFT: 409,
  NOT_ON_SHIFT: 400,
  SHIFT_NOT_FOUND: 404,
};

export const list = async (req, res) => {
  try {
    const { page, limit, search, role, isActive } = req.query;
    const { data, total } = await listUsers({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      search,
      role,
      isActive,
    });
    return paginated(
      res,
      data,
      { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) },
      'Users fetched',
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch users');
  }
};

export const getById = async (req, res) => {
  try {
    const user = await getUserById(Number(req.params.id));
    if (!user || user.isDeleted) return error(res, 'User not found', 404);
    return success(res, user, 'User fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch user');
  }
};

export const create = async (req, res) => {
  try {
    const user = await createUser(req.body, req.user.id);
    return success(res, user, 'User created', 201);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = err.code === 'P2002' ? 'Username already taken' : status === 400 ? err.message : 'Failed to create user';
    return error(res, message, status);
  }
};

export const update = async (req, res) => {
  try {
    const user = await updateUser(Number(req.params.id), req.body, req.user.id);
    return success(res, user, 'User updated');
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return error(res, 'User not found', 404);
    if (err.code === 'P2002') return error(res, 'Username already taken', 409);
    return error(res, 'Failed to update user');
  }
};

export const remove = async (req, res) => {
  try {
    await softDeleteUser(Number(req.params.id), req.user.id);
    return success(res, null, 'User deleted');
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return error(res, 'User not found', 404);
    return error(res, 'Failed to delete user');
  }
};

export const clockInHandler = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (req.user.role === ROLES.VIEWER) {
      return error(res, 'Viewers cannot clock in', 403);
    }
    if (req.user.id !== targetId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MANAGER) {
      return error(res, 'You can only clock in yourself', 403);
    }
    const user = await clockIn(targetId);
    return success(res, user, 'Clocked in successfully');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 400 || status === 409 ? err.message : 'Failed to clock in';
    return error(res, message, status);
  }
};

export const clockOutHandler = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (req.user.role === ROLES.VIEWER) {
      return error(res, 'Viewers cannot clock out', 403);
    }
    if (req.user.id !== targetId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MANAGER) {
      return error(res, 'You can only clock out yourself', 403);
    }
    const result = await clockOut(targetId);
    return success(res, result, 'Clocked out successfully');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 400 ? err.message : 'Failed to clock out';
    return error(res, message, status);
  }
};

export const shiftSummary = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (req.user.id !== targetId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MANAGER) {
      return error(res, 'You can only view your own shift summary', 403);
    }
    const summary = await getShiftSummary(targetId, req.query.shiftRecordId);
    return success(res, summary, 'Shift summary fetched');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    return error(res, err.message || 'Failed to fetch shift summary', status);
  }
};
