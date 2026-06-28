import { listCategories, getCategoryById, createCategory, updateCategory, softDeleteCategory } from '../services/category.service.js';
import { success, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  CATEGORY_NOT_FOUND: 404,
  CATEGORY_HAS_PRODUCTS: 400,
  CATEGORY_HAS_SUBCATEGORIES: 400,
  CATEGORY_CIRCULAR: 400,
  PARENT_CATEGORY_NOT_FOUND: 404,
  PARENT_CATEGORY_INACTIVE: 400,
};

export const list = async (req, res) => {
  try {
    const categories = await listCategories({ includeInactive: req.query.includeInactive === 'true' });
    return success(res, categories, 'Categories fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch categories');
  }
};

export const getById = async (req, res) => {
  try {
    const category = await getCategoryById(Number(req.params.id));
    if (!category || category.isDeleted) return error(res, 'Category not found', 404);
    return success(res, category, 'Category fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch category');
  }
};

export const create = async (req, res) => {
  try {
    const category = await createCategory(req.body);
    return success(res, category, 'Category created', 201);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code];
    if (status) return error(res, err.message, status);
    return error(res, 'Failed to create category');
  }
};

export const update = async (req, res) => {
  try {
    const category = await updateCategory(Number(req.params.id), req.body);
    return success(res, category, 'Category updated');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code];
    if (status) return error(res, err.message, status);
    return error(res, 'Failed to update category');
  }
};

export const remove = async (req, res) => {
  try {
    await softDeleteCategory(Number(req.params.id), req.user.id);
    return success(res, null, 'Category deleted');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code];
    if (status) return error(res, err.message, status);
    return error(res, 'Failed to delete category');
  }
};
