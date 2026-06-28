import prisma from '../config/db.js';
import { PO_STATUSES, MOVEMENT_TYPES, STOCK_REFERENCE_MODELS } from '../config/constants.js';
import { generatePONumber } from '../utils/generatePONumber.js';
import { incrementStock } from './inventory.service.js';

const poInclude = {
  vendor: { select: { id: true, name: true } },
  items: true,
  createdBy: { select: { id: true, fullName: true } },
};

// ── List ──────────────────────────────────────────

export const listPOs = async ({ page = 1, limit = 20, vendorId, status, startDate, endDate }) => {
  const where = { isDeleted: false };

  if (vendorId) where.vendorId = Number(vendorId);
  if (status) where.status = status;
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
    prisma.purchaseOrder.findMany({
      where,
      include: poInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { data, total };
};

// ── Get by ID ─────────────────────────────────────

export const getPOById = async (id) => {
  return prisma.purchaseOrder.findUnique({ where: { id }, include: poInclude });
};

// ── Create ────────────────────────────────────────

export const createPO = async (data, userId) => {
  return prisma.$transaction(async (tx) => {
    // Validate vendor
    const vendor = await tx.vendor.findUnique({ where: { id: data.vendorId } });
    if (!vendor || vendor.isDeleted) {
      const err = new Error('Vendor not found');
      err.code = 'VENDOR_NOT_FOUND';
      throw err;
    }
    if (!vendor.isActive) {
      const err = new Error('Vendor is inactive');
      err.code = 'VENDOR_INACTIVE';
      throw err;
    }

    // Validate products and freeze names
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isDeleted: false },
      select: { id: true, name: true, isActive: true },
    });
    if (products.length !== productIds.length) {
      const err = new Error('One or more products not found');
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    const productMap = {};
    for (const p of products) {
      if (!p.isActive) {
        const err = new Error(`Product "${p.name}" is inactive`);
        err.code = 'PRODUCT_INACTIVE';
        throw err;
      }
      productMap[p.id] = p;
    }

    // Build items with frozen names and calculated totals
    let totalAmount = 0;
    const itemsData = [];
    for (const item of data.items) {
      const product = productMap[item.productId];
      const totalCost = item.unitCost * item.orderedQty;
      totalAmount += totalCost;
      itemsData.push({
        productId: item.productId,
        productName: product.name,
        orderedQty: item.orderedQty,
        unitCost: item.unitCost,
        totalCost,
      });
    }

    // Generate PO number
    const poNumber = await generatePONumber(tx);

    // Create PO with items
    return tx.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: data.vendorId,
        totalAmount,
        notes: data.notes || null,
        status: PO_STATUSES.DRAFT,
        createdById: userId,
        items: { create: itemsData },
      },
      include: poInclude,
    });
  });
};

// ── Update ────────────────────────────────────────

export const updatePO = async (id, data, userId) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || po.isDeleted) {
    const err = new Error('Purchase order not found');
    err.code = 'PO_NOT_FOUND';
    throw err;
  }
  if (po.status !== PO_STATUSES.DRAFT) {
    const err = new Error('Only draft purchase orders can be updated');
    err.code = 'PO_NOT_DRAFT';
    throw err;
  }

  const updateData = { updatedById: userId };

  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status) updateData.status = data.status;
  if (data.vendorId) {
    const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
    if (!vendor || vendor.isDeleted || !vendor.isActive) {
      const err = new Error('Vendor not found or inactive');
      err.code = 'VENDOR_NOT_FOUND';
      throw err;
    }
    updateData.vendorId = data.vendorId;
  }
  if (data.orderedAt !== undefined) updateData.orderedAt = new Date(data.orderedAt);

  return prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: poInclude,
  });
};

// ── Update items (separate endpoint for draft PO) ─

export const updatePOItems = async (id, items, userId) => {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id } });
    if (!po || po.isDeleted) {
      const err = new Error('Purchase order not found');
      err.code = 'PO_NOT_FOUND';
      throw err;
    }
    if (po.status !== PO_STATUSES.DRAFT) {
      const err = new Error('Only draft purchase orders can have items updated');
      err.code = 'PO_NOT_DRAFT';
      throw err;
    }

    // Validate products
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isDeleted: false },
      select: { id: true, name: true, isActive: true },
    });
    if (products.length !== productIds.length) {
      const err = new Error('One or more products not found');
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    const productMap = {};
    for (const p of products) {
      if (!p.isActive) {
        const err = new Error(`Product "${p.name}" is inactive`);
        err.code = 'PRODUCT_INACTIVE';
        throw err;
      }
      productMap[p.id] = p;
    }

    // Delete old items and create new ones
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

    let totalAmount = 0;
    const itemsData = [];
    for (const item of items) {
      const product = productMap[item.productId];
      const totalCost = item.unitCost * item.orderedQty;
      totalAmount += totalCost;
      itemsData.push({
        productId: item.productId,
        productName: product.name,
        orderedQty: item.orderedQty,
        unitCost: item.unitCost,
        totalCost,
      });
    }

    await tx.purchaseOrderItem.createMany({ data: itemsData });

    return tx.purchaseOrder.update({
      where: { id },
      data: { totalAmount, updatedById: userId },
      include: poInclude,
    });
  });
};

// ── Soft-delete ───────────────────────────────────

export const softDeletePO = async (id, userId) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || po.isDeleted) {
    const err = new Error('Purchase order not found');
    err.code = 'PO_NOT_FOUND';
    throw err;
  }
  if (po.status !== PO_STATUSES.DRAFT) {
    const err = new Error('Only draft purchase orders can be deleted');
    err.code = 'PO_NOT_DRAFT';
    throw err;
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId,
    },
    include: poInclude,
  });
};

// ── GRN Receive ───────────────────────────────────

export const receiveItems = async (id, items, userId) => {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch PO with items
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po || po.isDeleted) {
      const err = new Error('Purchase order not found');
      err.code = 'PO_NOT_FOUND';
      throw err;
    }
    if (po.status !== PO_STATUSES.SENT && po.status !== PO_STATUSES.PARTIALLY_RECEIVED) {
      const err = new Error('PO must be SENT or PARTIALLY_RECEIVED to receive items');
      err.code = 'PO_CANNOT_RECEIVE';
      throw err;
    }

    // Build a map of PO items for validation
    const poItemMap = {};
    for (const poi of po.items) {
      poItemMap[poi.id] = poi;
    }

    let receivedCost = 0;

    // 2. Process each received item
    const seenItemIds = new Set();
    for (const received of items) {
      if (seenItemIds.has(received.itemId)) {
        const err = new Error(`Duplicate item ID ${received.itemId} in receive request`);
        err.code = 'DUPLICATE_ITEM';
        throw err;
      }
      seenItemIds.add(received.itemId);

      const poItem = poItemMap[received.itemId];
      if (!poItem) {
        const err = new Error(`PO item ${received.itemId} not found in this order`);
        err.code = 'PO_ITEM_NOT_FOUND';
        throw err;
      }

      const remaining = poItem.orderedQty - poItem.receivedQty;
      if (received.receivedQty > remaining) {
        const err = new Error(
          `Received quantity (${received.receivedQty}) exceeds remaining (${remaining}) for "${poItem.productName}"`,
        );
        err.code = 'RECEIVED_EXCEEDS_ORDERED';
        throw err;
      }

      // Increment stock with PURCHASE movement type
      await incrementStock(
        tx,
        poItem.productId,
        received.receivedQty,
        userId,
        STOCK_REFERENCE_MODELS.PURCHASE_ORDER,
        po.id,
        MOVEMENT_TYPES.PURCHASE,
      );

      // Update PO item receivedQty
      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQty: poItem.receivedQty + received.receivedQty },
      });

      receivedCost += poItem.unitCost * received.receivedQty;
    }

    // 3. Recalculate PO status
    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });
    const allFullyReceived = updatedItems.every((i) => i.receivedQty >= i.orderedQty);
    const newStatus = allFullyReceived
      ? PO_STATUSES.RECEIVED
      : PO_STATUSES.PARTIALLY_RECEIVED;

    const updateData = {
      status: newStatus,
      updatedById: userId,
    };
    if (allFullyReceived) updateData.receivedAt = new Date();

    // 4. Update vendor balance (we owe them for what we received)
    if (receivedCost > 0) {
      await tx.vendor.update({
        where: { id: po.vendorId },
        data: { balance: { decrement: receivedCost } },
      });
    }

    const updated = await tx.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: poInclude,
    });

    return updated;
  });
};
