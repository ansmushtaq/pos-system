import {
  createSale,
  listSales,
  getSaleById,
  voidSale,
  returnItems,
} from '../services/sale.service.js';
import { success, paginated, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  CREDIT_REQUIRES_CUSTOMER: 400,
  PRODUCT_INACTIVE: 400,
  INSUFFICIENT_STOCK: 400,
  INSUFFICIENT_TENDER: 400,
  INVALID_SEMI_CREDIT: 400,
  SALE_ALREADY_VOIDED: 400,
  SALE_NOT_COMPLETED: 400,
  RETURN_ITEM_NOT_FOUND: 404,
  INVALID_RETURN_QTY: 400,
  DUPLICATE_RETURN_ITEM: 400,
  DISCOUNT_EXCEEDS_SUBTOTAL: 400,
  PRODUCT_NOT_FOUND: 404,
  CUSTOMER_NOT_FOUND: 404,
  SALE_NOT_FOUND: 404,
  INVENTORY_NOT_FOUND: 500,
  PRICE_OVERRIDE_REQUIRED: 403,
};

export const create = async (req, res) => {
  try {
    const sale = await createSale(req.body, req.user);
    return success(res, sale, 'Sale created', 201);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to create sale' : err.message;
    return error(res, message, status);
  }
};

export const list = async (req, res) => {
  try {
    const { page, limit, startDate, endDate, status, paymentMethod, sellerId, search } = req.query;
    const { data, total } = await listSales({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      startDate,
      endDate,
      status,
      paymentMethod,
      sellerId,
      search,
    });
    return paginated(res, data, { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) }, 'Sales fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch sales');
  }
};

export const getById = async (req, res) => {
  try {
    const sale = await getSaleById(Number(req.params.id));
    if (!sale) return error(res, 'Sale not found', 404);
    return success(res, sale, 'Sale fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch sale');
  }
};

export const voidSaleOrder = async (req, res) => {
  try {
    const sale = await voidSale(Number(req.params.id), req.body.voidReason, req.user.id);
    return success(res, sale, 'Sale voided');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to void sale' : err.message;
    return error(res, message, status);
  }
};

export const returnSaleItems = async (req, res) => {
  try {
    const result = await returnItems(Number(req.params.id), req.body.items, req.body.returnReason, req.user.id);
    return success(res, result, 'Items returned successfully');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to return items' : err.message;
    return error(res, message, status);
  }
};
