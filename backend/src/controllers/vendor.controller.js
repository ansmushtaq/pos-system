import {
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  softDeleteVendor,
} from '../services/vendor.service.js';
import { success, paginated, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  VALIDATION_ERROR: 400,
  P2025: 404,
};

export const list = async (req, res) => {
  try {
    const { page, limit, search, isActive } = req.query;
    const { data, total } = await listVendors({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      search,
      isActive,
    });
    return paginated(
      res,
      data,
      { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) },
      'Vendors fetched',
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch vendors');
  }
};

export const getById = async (req, res) => {
  try {
    const vendor = await getVendorById(Number(req.params.id));
    if (!vendor || vendor.isDeleted) return error(res, 'Vendor not found', 404);
    return success(res, vendor, 'Vendor fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch vendor');
  }
};

export const create = async (req, res) => {
  try {
    const vendor = await createVendor(req.body, req.user.id);
    return success(res, vendor, 'Vendor created', 201);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 400 ? err.message : 'Failed to create vendor';
    return error(res, message, status);
  }
};

export const update = async (req, res) => {
  try {
    const vendor = await updateVendor(Number(req.params.id), req.body, req.user.id);
    return success(res, vendor, 'Vendor updated');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to update vendor' : err.message;
    return error(res, message, status);
  }
};

export const remove = async (req, res) => {
  try {
    await softDeleteVendor(Number(req.params.id), req.user.id);
    return success(res, null, 'Vendor deleted');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to delete vendor' : err.message;
    return error(res, message, status);
  }
};
