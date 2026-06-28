import { listProducts, getProductById, createProduct, updateProduct, softDeleteProduct } from '../services/product.service.js';
import { updateProductPrice, getPriceHistory } from '../services/pricing.service.js';
import { success, paginated, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  PRODUCT_NOT_FOUND: 404,
  CATEGORY_NOT_FOUND: 404,
};

export const list = async (req, res) => {
  try {
    const { page, limit, search, categoryId, isActive } = req.query;
    const { data, total } = await listProducts({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      search,
      categoryId,
      isActive,
    });
    return paginated(res, data, { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) }, 'Products fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch products');
  }
};

export const getById = async (req, res) => {
  try {
    const product = await getProductById(Number(req.params.id));
    if (!product) return error(res, 'Product not found', 404);
    return success(res, product, 'Product fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch product');
  }
};

export const create = async (req, res) => {
  try {
    const product = await createProduct(req.body, req.user.id);
    return success(res, product, 'Product created', 201);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return error(res, 'SKU or barcode already exists', 409);
    return error(res, 'Failed to create product');
  }
};

export const update = async (req, res) => {
  try {
    const product = await updateProduct(Number(req.params.id), req.body, req.user.id);
    return success(res, product, 'Product updated');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code];
    if (status) return error(res, err.message, status);
    if (err.code === 'P2002') return error(res, 'SKU already in use', 409);
    return error(res, 'Failed to update product');
  }
};

export const updatePrice = async (req, res) => {
  try {
    const product = await updateProductPrice(Number(req.params.id), req.body, req.user.id);
    return success(res, product, 'Product price updated');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code];
    if (status) return error(res, err.message, status);
    return error(res, 'Failed to update price');
  }
};

export const remove = async (req, res) => {
  try {
    await softDeleteProduct(Number(req.params.id), req.user.id);
    return success(res, null, 'Product deleted');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code];
    if (status) return error(res, err.message, status);
    return error(res, 'Failed to delete product');
  }
};

export const priceHistory = async (req, res) => {
  try {
    const history = await getPriceHistory(Number(req.params.id));
    return success(res, history, 'Price history fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch price history');
  }
};
