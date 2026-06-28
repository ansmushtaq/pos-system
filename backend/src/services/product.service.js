import prisma from '../config/db.js';
import { calculateCostPrice } from './pricing.service.js';
import { createInventoryRecord } from './inventory.service.js';
import { UNITS } from '../config/constants.js';

const productSelect = {
  id: true,
  name: true,
  sku: true,
  barcode: true,
  unit: true,
  purchasePrice: true,
  purchaseTaxPercent: true,
  costPrice: true,
  salePrice: true,
  description: true,
  imageUrl: true,
  expiryTracking: true,
  requiresPrescription: true,
  isService: true,
  isActive: true,
  isDeleted: true,
  categoryId: true,
  vendorId: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  inventory: { select: { id: true, quantityOnHand: true, reorderLevel: true } },
};

export const listProducts = async ({ page = 1, limit = 20, search, categoryId, isActive }) => {
  const where = { isDeleted: false };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = Number(categoryId);
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total };
};

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });
  if (!product || product.isDeleted) return null;
  return product;
};

export const createProduct = async (data, userId) => {
  const costPrice = calculateCostPrice(data.purchasePrice, data.purchaseTaxPercent ?? 0);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        unit: data.unit ?? UNITS.PCS,
        purchasePrice: data.purchasePrice,
        purchaseTaxPercent: data.purchaseTaxPercent ?? 0,
        costPrice,
        salePrice: data.salePrice,
        description: data.description,
        imageUrl: data.imageUrl,
        expiryTracking: data.expiryTracking ?? false,
        requiresPrescription: data.requiresPrescription ?? false,
        isService: data.isService ?? false,
        isActive: data.isActive ?? true,
        categoryId: data.categoryId,
        vendorId: data.vendorId || null,
        createdById: userId,
      },
      select: productSelect,
    });

    await createInventoryRecord(tx, product.id, data.reorderLevel ?? 0);

    return tx.product.findUnique({
      where: { id: product.id },
      select: productSelect,
    });
  });
};

export const updateProduct = async (id, data, userId) => {
  const hasPriceChanges = data.purchasePrice !== undefined
    || data.purchaseTaxPercent !== undefined
    || data.salePrice !== undefined;

  if (hasPriceChanges) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({
        where: { id },
        select: { id: true, isDeleted: true, purchasePrice: true, purchaseTaxPercent: true, costPrice: true, salePrice: true },
      });
      if (!current || current.isDeleted) {
        const err = new Error('Product not found');
        err.code = 'PRODUCT_NOT_FOUND';
        throw err;
      }

      const newPurchasePrice = data.purchasePrice ?? current.purchasePrice;
      const newPurchaseTaxPercent = data.purchaseTaxPercent ?? current.purchaseTaxPercent;
      const newCostPrice = calculateCostPrice(newPurchasePrice, newPurchaseTaxPercent);
      const newSalePrice = data.salePrice ?? current.salePrice;

      await tx.productPriceHistory.create({
        data: {
          productId: id,
          oldPurchasePrice: current.purchasePrice,
          newPurchasePrice,
          oldPurchaseTaxPercent: current.purchaseTaxPercent,
          newPurchaseTaxPercent,
          oldCostPrice: current.costPrice,
          newCostPrice,
          oldSalePrice: current.salePrice,
          newSalePrice,
          changeReason: 'Product edit — price updated',
          changedById: userId,
        },
      });

      return tx.product.update({
        where: { id },
        data: {
          name: data.name,
          sku: data.sku,
          barcode: data.barcode,
          unit: data.unit,
          purchasePrice: newPurchasePrice,
          purchaseTaxPercent: newPurchaseTaxPercent,
          costPrice: newCostPrice,
          salePrice: newSalePrice,
          description: data.description,
          imageUrl: data.imageUrl,
          expiryTracking: data.expiryTracking,
          requiresPrescription: data.requiresPrescription,
          isService: data.isService,
          isActive: data.isActive,
          categoryId: data.categoryId,
          vendorId: data.vendorId,
          updatedById: userId,
        },
        select: productSelect,
      });
    });
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('Product not found');
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  return prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      unit: data.unit,
      description: data.description,
      imageUrl: data.imageUrl,
      expiryTracking: data.expiryTracking,
      requiresPrescription: data.requiresPrescription,
      isService: data.isService,
      isActive: data.isActive,
      categoryId: data.categoryId,
      vendorId: data.vendorId,
      updatedById: userId,
    },
    select: productSelect,
  });
};

export const softDeleteProduct = async (id, userId) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('Product not found');
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  return prisma.product.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId,
    },
  });
};
