import prisma from '../config/db.js';
import { MOVEMENT_TYPES } from '../config/constants.js';

const stockMovementInclude = {
  product: { select: { id: true, name: true, sku: true } },
  performedBy: { select: { id: true, fullName: true } },
};

const inventoryInclude = {
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      unit: true,
      isActive: true,
      isDeleted: true,
      category: { select: { id: true, name: true } },
    },
  },
};

export const listInventory = async ({ page = 1, limit = 20, search, categoryId, lowStock }) => {
  const where = { product: { isDeleted: false } };

  if (search) {
    where.product.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.product.categoryId = Number(categoryId);

  const allData = await prisma.inventory.findMany({
    where,
    include: inventoryInclude,
    orderBy: { updatedAt: 'desc' },
  });

  let filtered = allData;
  if (lowStock === 'true' || lowStock === true) {
    filtered = allData.filter(
      (i) => i.quantityOnHand > 0 && i.quantityOnHand <= i.reorderLevel
    );
  }

  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);

  return { data, total };
};

export const getInventoryByProductId = async (productId) => {
  return prisma.inventory.findUnique({
    where: { productId },
    include: inventoryInclude,
  });
};

export const getStockMovements = async ({
  productId,
  page = 1,
  limit = 20,
  movementType,
  startDate,
  endDate,
}) => {
  const where = {};

  if (productId) where.productId = productId;
  if (movementType) where.movementType = movementType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: stockMovementInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { data, total };
};

export const adjustStock = async (data, userId) => {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: { productId: data.productId },
    });

    if (!inventory) {
      const err = new Error('Inventory record not found for this product');
      err.code = 'INVENTORY_NOT_FOUND';
      throw err;
    }

    const quantityBefore = inventory.quantityOnHand;
    let newQty;

    if (data.movementType === MOVEMENT_TYPES.ADJUSTMENT_IN) {
      newQty = quantityBefore + data.quantity;
    } else if (data.movementType === MOVEMENT_TYPES.ADJUSTMENT_OUT) {
      newQty = quantityBefore - data.quantity;
    } else {
      throw new Error(`Invalid movement type: ${data.movementType}`);
    }

    if (newQty < 0) {
      const err = new Error(
        'Insufficient stock — adjustment would result in negative quantity'
      );
      err.code = 'INSUFFICIENT_STOCK';
      throw err;
    }

    await tx.stockMovement.create({
      data: {
        movementType: data.movementType,
        quantity: data.quantity,
        quantityBefore,
        quantityAfter: newQty,
        notes: data.notes || null,
        productId: data.productId,
        performedById: userId,
      },
    });

    const updated = await tx.inventory.update({
      where: { productId: data.productId },
      data: {
        quantityOnHand: newQty,
        lastMovementAt: new Date(),
      },
      include: inventoryInclude,
    });

    return updated;
  });
};

export const decrementStock = async (tx, productId, quantity, userId, referenceModel, referenceId = null, movementType = MOVEMENT_TYPES.SALE) => {
  const inventory = await tx.inventory.findUnique({ where: { productId } });
  if (!inventory) {
    const err = new Error('Inventory record not found');
    err.code = 'INVENTORY_NOT_FOUND';
    throw err;
  }

  const quantityBefore = inventory.quantityOnHand;
  const quantityAfter = quantityBefore - quantity;

  if (quantityAfter < 0) {
    const err = new Error('Insufficient stock — sale would result in negative quantity');
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }

  await tx.stockMovement.create({
    data: {
      movementType,
      quantity,
      quantityBefore,
      quantityAfter,
      referenceModel,
      referenceId,
      productId,
      performedById: userId,
    },
  });

  return tx.inventory.update({
    where: { productId },
    data: {
      quantityOnHand: quantityAfter,
      lastMovementAt: new Date(),
    },
  });
};

export const createInventoryRecord = async (tx, productId, reorderLevel = 0) => {
  return tx.inventory.create({
    data: { productId, quantityOnHand: 0, reorderLevel },
  });
};

export const incrementStock = async (tx, productId, quantity, userId, referenceModel, referenceId = null, movementType = MOVEMENT_TYPES.SALE_VOID) => {
  const inventory = await tx.inventory.findUnique({ where: { productId } });
  if (!inventory) {
    const err = new Error('Inventory record not found');
    err.code = 'INVENTORY_NOT_FOUND';
    throw err;
  }

  const quantityBefore = inventory.quantityOnHand;
  const quantityAfter = quantityBefore + quantity;

  await tx.stockMovement.create({
    data: {
      movementType,
      quantity,
      quantityBefore,
      quantityAfter,
      referenceModel,
      referenceId,
      productId,
      performedById: userId,
    },
  });

  return tx.inventory.update({
    where: { productId },
    data: {
      quantityOnHand: quantityAfter,
      lastMovementAt: new Date(),
    },
  });
};
