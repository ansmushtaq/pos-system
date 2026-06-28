import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  payCredit,
  getCreditHistory,
} from '../services/customer.service.js';
import { success, paginated, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  VALIDATION_ERROR: 400,
  P2025: 404,
  CUSTOMER_NOT_FOUND: 404,
  INSUFFICIENT_CREDIT: 400,
  OUTSTANDING_CREDIT: 400,
};

export const list = async (req, res) => {
  try {
    const { page, limit, search, isActive } = req.query;
    const { data, total } = await listCustomers({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      search,
      isActive,
    });
    return paginated(
      res,
      data,
      { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) },
      'Customers fetched',
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch customers');
  }
};

export const getById = async (req, res) => {
  try {
    const customer = await getCustomerById(Number(req.params.id));
    if (!customer || customer.isDeleted) return error(res, 'Customer not found', 404);
    return success(res, customer, 'Customer fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch customer');
  }
};

export const create = async (req, res) => {
  try {
    const customer = await createCustomer(req.body, req.user.id);
    return success(res, customer, 'Customer created', 201);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 400 ? err.message : 'Failed to create customer';
    return error(res, message, status);
  }
};

export const update = async (req, res) => {
  try {
    const customer = await updateCustomer(Number(req.params.id), req.body, req.user.id);
    return success(res, customer, 'Customer updated');
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return error(res, 'Customer not found', 404);
    return error(res, 'Failed to update customer');
  }
};

export const remove = async (req, res) => {
  try {
    await softDeleteCustomer(Number(req.params.id), req.user.id);
    return success(res, null, 'Customer deleted');
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return error(res, 'Customer not found', 404);
    return error(res, 'Failed to delete customer');
  }
};

export const payCreditHandler = async (req, res) => {
  try {
    const customer = await payCredit(
      Number(req.params.id),
      req.body.amount,
      req.body.note,
      req.user.id,
    );
    return success(res, customer, 'Credit payment recorded');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 400 ? err.message : 'Failed to record payment';
    return error(res, message, status);
  }
};

export const creditHistory = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { data, total } = await getCreditHistory(Number(req.params.id), {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
    });
    return paginated(
      res,
      data,
      { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) },
      'Credit history fetched',
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch credit history');
  }
};
