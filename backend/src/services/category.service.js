import prisma from '../config/db.js';

const categorySelect = {
  id: true,
  name: true,
  isActive: true,
  isDeleted: true,
  parentCategoryId: true,
  createdAt: true,
  updatedAt: true,
  parentCategory: { select: { id: true, name: true } },
};

export const listCategories = async ({ includeInactive = false } = {}) => {
  const where = { isDeleted: false };
  if (!includeInactive) where.isActive = true;

  return prisma.category.findMany({
    where,
    select: categorySelect,
    orderBy: { name: 'asc' },
  });
};

export const getCategoryById = async (id) => {
  return prisma.category.findFirst({
    where: { id, isDeleted: false },
    select: {
      ...categorySelect,
      subCategories: { select: { id: true, name: true, isActive: true } },
      products: { select: { id: true, name: true }, where: { isDeleted: false }, take: 20 },
    },
  });
};

export const createCategory = async (data) => {
  if (data.parentCategoryId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentCategoryId },
      select: { id: true, isActive: true, isDeleted: true },
    });
    if (!parent || parent.isDeleted) {
      const err = new Error('Parent category not found');
      err.code = 'PARENT_CATEGORY_NOT_FOUND';
      throw err;
    }
    if (!parent.isActive) {
      const err = new Error('Parent category is inactive');
      err.code = 'PARENT_CATEGORY_INACTIVE';
      throw err;
    }
  }

  return prisma.category.create({
    data: {
      name: data.name,
      isActive: data.isActive ?? true,
      parentCategoryId: data.parentCategoryId || null,
    },
    select: categorySelect,
  });
};

export const updateCategory = async (id, data) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('Category not found');
    err.code = 'CATEGORY_NOT_FOUND';
    throw err;
  }

  if (data.parentCategoryId) {
    if (data.parentCategoryId === id) {
      const err = new Error('Category cannot be its own parent');
      err.code = 'CATEGORY_CIRCULAR';
      throw err;
    }

    let currentId = data.parentCategoryId;
    const visited = new Set([id]);
    while (currentId) {
      if (visited.has(currentId)) {
        const err = new Error('Circular parent reference detected');
        err.code = 'CATEGORY_CIRCULAR';
        throw err;
      }
      visited.add(currentId);
      const parent = await prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, parentCategoryId: true },
      });
      if (!parent) break;
      currentId = parent.parentCategoryId;
    }
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      isActive: data.isActive,
      parentCategoryId: data.parentCategoryId,
    },
    select: categorySelect,
  });
};

export const softDeleteCategory = async (id, userId) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('Category not found');
    err.code = 'CATEGORY_NOT_FOUND';
    throw err;
  }

  const productCount = await prisma.product.count({
    where: { categoryId: id, isDeleted: false },
  });
  if (productCount > 0) {
    const err = new Error(`Cannot delete category — ${productCount} active product(s) are linked to it`);
    err.code = 'CATEGORY_HAS_PRODUCTS';
    throw err;
  }

  const subCategoryCount = await prisma.category.count({
    where: { parentCategoryId: id, isDeleted: false },
  });
  if (subCategoryCount > 0) {
    const err = new Error(`Cannot delete category — ${subCategoryCount} subcategory(ies) are linked to it`);
    err.code = 'CATEGORY_HAS_SUBCATEGORIES';
    throw err;
  }

  return prisma.category.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId,
    },
  });
};
