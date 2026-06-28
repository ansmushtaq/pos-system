import {
  listPOs,
  getPOById,
  createPO,
  updatePO,
  updatePOItems,
  softDeletePO,
  receiveItems,
} from '../services/purchaseOrder.service.js';
import { success, paginated, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  VENDOR_NOT_FOUND: 404,
  VENDOR_INACTIVE: 400,
  PRODUCT_NOT_FOUND: 404,
  PRODUCT_INACTIVE: 400,
  PO_NOT_FOUND: 404,
  PO_NOT_DRAFT: 400,
  PO_CANNOT_RECEIVE: 400,
  RECEIVED_EXCEEDS_ORDERED: 400,
  PO_ITEM_NOT_FOUND: 404,
  DUPLICATE_ITEM: 400,
};

export const list = async (req, res) => {
  try {
    const { page, limit, vendorId, status, startDate, endDate } = req.query;
    const { data, total } = await listPOs({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      vendorId,
      status,
      startDate,
      endDate,
    });
    return paginated(
      res,
      data,
      { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) },
      'Purchase orders fetched',
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch purchase orders');
  }
};

export const getById = async (req, res) => {
  try {
    const po = await getPOById(Number(req.params.id));
    if (!po || po.isDeleted) return error(res, 'Purchase order not found', 404);
    return success(res, po, 'Purchase order fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch purchase order');
  }
};

export const create = async (req, res) => {
  try {
    const po = await createPO(req.body, req.user.id);
    return success(res, po, 'Purchase order created', 201);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    return error(res, err.message, status);
  }
};

export const update = async (req, res) => {
  try {
    const po = await updatePO(Number(req.params.id), req.body, req.user.id);
    return success(res, po, 'Purchase order updated');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    return error(res, err.message, status);
  }
};

export const updateItems = async (req, res) => {
  try {
    const po = await updatePOItems(Number(req.params.id), req.body.items, req.user.id);
    return success(res, po, 'Purchase order items updated');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    return error(res, err.message, status);
  }
};

export const remove = async (req, res) => {
  try {
    await softDeletePO(Number(req.params.id), req.user.id);
    return success(res, null, 'Purchase order deleted');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    return error(res, err.message, status);
  }
};

export const receive = async (req, res) => {
  try {
    const po = await receiveItems(Number(req.params.id), req.body.items, req.user.id);
    return success(res, po, 'Items received successfully');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    return error(res, err.message, status);
  }
};
