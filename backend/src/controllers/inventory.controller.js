import {
  listInventory,
  getInventoryByProductId,
  getStockMovements,
  adjustStock,
} from '../services/inventory.service.js';
import { success, paginated, error } from '../utils/apiResponse.js';

export const list = async (req, res) => {
  try {
    const { page, limit, search, categoryId, lowStock } = req.query;
    const { data, total } = await listInventory({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      search,
      categoryId,
      lowStock,
    });
    return paginated(
      res,
      data,
      {
        total,
        page: Number(page) || 1,
        limit: Math.min(Number(limit) || 20, 100),
      },
      'Inventory fetched'
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch inventory');
  }
};

export const getByProductId = async (req, res) => {
  try {
    const inventory = await getInventoryByProductId(Number(req.params.productId));
    if (!inventory) return error(res, 'Inventory not found', 404);
    return success(res, inventory, 'Inventory fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch inventory');
  }
};

export const movements = async (req, res) => {
  try {
    const { page, limit, movementType, startDate, endDate } = req.query;
    const { data, total } = await getStockMovements({
      productId: Number(req.params.productId),
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      movementType,
      startDate,
      endDate,
    });
    return paginated(
      res,
      data,
      {
        total,
        page: Number(page) || 1,
        limit: Math.min(Number(limit) || 20, 100),
      },
      'Stock movements fetched'
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch stock movements');
  }
};

export const allMovements = async (req, res) => {
  try {
    const { page, limit, movementType, startDate, endDate } = req.query;
    const { data, total } = await getStockMovements({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      movementType,
      startDate,
      endDate,
    });
    return paginated(
      res,
      data,
      {
        total,
        page: Number(page) || 1,
        limit: Math.min(Number(limit) || 20, 100),
      },
      'Stock movements fetched'
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch stock movements');
  }
};

export const adjust = async (req, res) => {
  try {
    const result = await adjustStock(req.body, req.user.id);
    return success(res, result, 'Stock adjusted successfully');
  } catch (err) {
    console.error(err);
    if (err.code === 'INSUFFICIENT_STOCK') {
      return error(res, err.message, 400);
    }
    if (err.code === 'INVENTORY_NOT_FOUND') {
      return error(res, err.message, 404);
    }
    return error(res, 'Failed to adjust stock');
  }
};
