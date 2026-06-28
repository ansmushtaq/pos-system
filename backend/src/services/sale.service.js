import prisma from '../config/db.js';
import { PAYMENT_METHODS, SALE_STATUSES, STOCK_REFERENCE_MODELS, CREDIT_TRANSACTION_TYPES, MOVEMENT_TYPES } from '../config/constants.js';
import { generateInvoiceNumber } from '../utils/generateInvoiceNumber.js';
import { decrementStock, incrementStock } from './inventory.service.js';

const saleInclude = {
  items: true,
  seller: { select: { id: true, fullName: true } },
  customer: { select: { id: true, name: true, phone: true } },
};

export const createSale = async (saleData, userId) => {
  return prisma.$transaction(async (tx) => {
    // 0. Offline idempotency — dedup by offlineId
    if (saleData.offlineId) {
      const existing = await tx.saleOrder.findUnique({
        where: { offlineId: saleData.offlineId },
        include: saleInclude,
      });
      if (existing) return existing;
    }

    // 1. Validate payment method requires customer for credit/semi-credit
    if (
      (saleData.paymentMethod === PAYMENT_METHODS.CREDIT ||
        saleData.paymentMethod === PAYMENT_METHODS.SEMI_CREDIT) &&
      !saleData.customerId
    ) {
      const err = new Error('Credit or semi-credit sales require a customer');
      err.code = 'CREDIT_REQUIRES_CUSTOMER';
      throw err;
    }

    // Validate customer exists if provided
    if (saleData.customerId) {
      const customer = await tx.customer.findUnique({
        where: { id: saleData.customerId, isDeleted: false },
        select: { id: true },
      });
      if (!customer) {
        const err = new Error('Customer not found');
        err.code = 'CUSTOMER_NOT_FOUND';
        throw err;
      }
    }

    // 2. Fetch all products in one query
    const productIds = saleData.items.map((i) => i.productId);
    const uniqueProductIds = [...new Set(productIds)];
    const products = await tx.product.findMany({
      where: { id: { in: uniqueProductIds }, isDeleted: false },
    });

    if (products.length !== uniqueProductIds.length) {
      const err = new Error('One or more products not found or deleted');
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

    // 3. Build sale items with frozen prices
    let subTotal = 0;
    let totalCost = 0;
    let totalProfit = 0;

    const saleItemsData = [];
    for (const item of saleData.items) {
      const product = productMap[item.productId];
      const unitPrice = item.unitPrice ?? product.salePrice;
      const isPriceOverridden =
        item.unitPrice !== undefined && item.unitPrice !== product.salePrice;
      const originalUnitPrice = product.salePrice;
      const discount = item.discount ?? 0;
      const costPrice = product.costPrice;
      const quantity = item.quantity;
      const totalPrice = (unitPrice - discount) * quantity;
      const profitAmount = (unitPrice - costPrice - discount) * quantity;

      subTotal += totalPrice;
      totalCost += costPrice * quantity;
      totalProfit += profitAmount;

      saleItemsData.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice,
        costPrice,
        originalUnitPrice,
        isPriceOverridden,
        isService: product.isService,
        discount,
        totalPrice,
        profitAmount,
        priceOverriddenById: isPriceOverridden ? userId : null,
      });
    }

    // 4. Calculate order totals
    const discountAmount = saleData.discountAmount ?? 0;
    const taxAmount = saleData.taxAmount ?? 0;

    if (discountAmount > subTotal) {
      const err = new Error('Discount amount cannot exceed subtotal');
      err.code = 'DISCOUNT_EXCEEDS_SUBTOTAL';
      throw err;
    }

    const totalAmount = subTotal - discountAmount + taxAmount;
    totalProfit = totalProfit - discountAmount;

    // 5. Derive payment fields
    let amountTendered = 0;
    let changeGiven = 0;
    let amountOnCredit = 0;

    switch (saleData.paymentMethod) {
      case PAYMENT_METHODS.CASH:
        amountTendered = saleData.amountTendered ?? totalAmount;
        changeGiven = Math.max(0, amountTendered - totalAmount);
        if (amountTendered < totalAmount) {
          const err = new Error('Amount tendered is less than total amount');
          err.code = 'INSUFFICIENT_TENDER';
          throw err;
        }
        break;
      case PAYMENT_METHODS.CARD:
        amountTendered = totalAmount;
        changeGiven = 0;
        break;
      case PAYMENT_METHODS.CREDIT:
        amountOnCredit = totalAmount;
        break;
      case PAYMENT_METHODS.SEMI_CREDIT:
        amountTendered = saleData.amountTendered ?? 0;
        if (amountTendered <= 0) {
          const err = new Error('Semi-credit requires a partial cash payment');
          err.code = 'INVALID_SEMI_CREDIT';
          throw err;
        }
        amountOnCredit = totalAmount - amountTendered;
        if (amountOnCredit <= 0) {
          const err = new Error('Semi-credit amount tendered must be less than total amount');
          err.code = 'INVALID_SEMI_CREDIT';
          throw err;
        }
        break;
    }

    // 6. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tx);

    // 7. Create SaleOrder with items
    const sale = await tx.saleOrder.create({
      data: {
        invoiceNumber,
        customerName: saleData.customerName ?? 'Walk-in Customer',
        subTotal,
        discountAmount,
        taxAmount,
        totalAmount,
        totalProfit,
        totalCost,
        paymentMethod: saleData.paymentMethod,
        amountTendered,
        changeGiven,
        amountOnCredit,
        sellerId: userId,
        customerId: saleData.customerId ?? null,
        offlineId: saleData.offlineId ?? null,
        notes: saleData.notes ?? null,
        items: {
          create: saleItemsData,
        },
      },
      include: saleInclude,
    });

    // 8. Decrement stock for non-service items
    for (const item of saleData.items) {
      const product = productMap[item.productId];
      if (!product.isService) {
        await decrementStock(
          tx,
          item.productId,
          item.quantity,
          userId,
          STOCK_REFERENCE_MODELS.SALE_ORDER,
          sale.id,
        );
      }
    }

    // 9. Update customer aggregates
    if (saleData.customerId) {
      await tx.customer.update({
        where: { id: saleData.customerId },
        data: {
          totalSpent: { increment: totalAmount },
          ...(amountOnCredit > 0 ? { creditBalance: { increment: amountOnCredit } } : {}),
        },
      });

      if (amountOnCredit > 0) {
        const custAfter = await tx.customer.findUnique({
          where: { id: saleData.customerId },
          select: { creditBalance: true },
        });
        await tx.creditTransaction.create({
          data: {
            type: CREDIT_TRANSACTION_TYPES.ISSUED,
            amount: amountOnCredit,
            balanceBefore: custAfter.creditBalance - amountOnCredit,
            balanceAfter: custAfter.creditBalance,
            customerId: saleData.customerId,
            saleOrderId: sale.id,
            createdById: userId,
          },
        });
      }
    }

    return sale;
  });
};

export const listSales = async ({
  page = 1,
  limit = 20,
  startDate,
  endDate,
  status,
  paymentMethod,
  sellerId,
  search,
}) => {
  const where = {};

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (sellerId) where.sellerId = Number(sellerId);

  const [data, total] = await Promise.all([
    prisma.saleOrder.findMany({
      where,
      include: {
        seller: { select: { id: true, fullName: true } },
        customer: { select: { id: true, name: true } },
        items: { select: { unitPrice: true, discount: true, quantity: true, returnedQty: true } },
        _count: { select: { items: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.saleOrder.count({ where }),
  ]);

  // Compute net total (original − returned) for each sale
  const enriched = data.map((sale) => {
    const returnedAmount = (sale.items || []).reduce(
      (sum, i) => sum + (i.unitPrice - i.discount) * i.returnedQty, 0
    );
    return { ...sale, returnedAmount, netTotal: sale.totalAmount - returnedAmount };
  });

  return { data: enriched, total };
};

export const getSaleById = async (id) => {
  return prisma.saleOrder.findUnique({
    where: { id },
    include: saleInclude,
  });
};

export const voidSale = async (id, voidReason, userId) => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.saleOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      const err = new Error('Sale not found');
      err.code = 'SALE_NOT_FOUND';
      throw err;
    }

    if (sale.status !== SALE_STATUSES.COMPLETED) {
      const err = new Error('Only completed sales can be voided');
      err.code = 'SALE_ALREADY_VOIDED';
      throw err;
    }

    // 3. Set status = VOIDED, voidedAt = now, voidedById, voidReason
    const voided = await tx.saleOrder.update({
      where: { id },
      data: {
        status: SALE_STATUSES.VOIDED,
        voidedAt: new Date(),
        voidReason,
        voidedById: userId,
      },
      include: saleInclude,
    });

    // 4. Restore stock for non-service items (using frozen isService from sale items)
    for (const item of sale.items) {
      if (!item.isService) {
        await incrementStock(
          tx,
          item.productId,
          item.quantity,
          userId,
          STOCK_REFERENCE_MODELS.SALE_ORDER,
          sale.id,
        );
      }
    }

    // 5. Reverse customer credit balance
    if (sale.customerId) {
      const updateData = { totalSpent: { decrement: sale.totalAmount } };
      if (sale.amountOnCredit > 0) {
        updateData.creditBalance = { decrement: sale.amountOnCredit };
      }

      await tx.customer.update({
        where: { id: sale.customerId },
        data: updateData,
      });

      if (sale.amountOnCredit > 0) {
        const custAfter = await tx.customer.findUnique({
          where: { id: sale.customerId },
          select: { creditBalance: true },
        });
        await tx.creditTransaction.create({
          data: {
            type: CREDIT_TRANSACTION_TYPES.VOID_REVERSAL,
            amount: sale.amountOnCredit,
            balanceBefore: custAfter.creditBalance + sale.amountOnCredit,
            balanceAfter: custAfter.creditBalance,
            customerId: sale.customerId,
            saleOrderId: sale.id,
            createdById: userId,
          },
        });
      }
    }

    return voided;
  });
};

export const returnItems = async (id, returnRequests, returnReason, userId) => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.saleOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      const err = new Error('Sale not found');
      err.code = 'SALE_NOT_FOUND';
      throw err;
    }

    if (sale.status !== SALE_STATUSES.COMPLETED) {
      const err = new Error('Only completed sales can have items returned');
      err.code = 'SALE_NOT_COMPLETED';
      throw err;
    }

    const itemMap = {};
    for (const item of sale.items) itemMap[item.id] = item;

    let totalRefund = 0;
    let creditRefund = 0;
    let cashRefund = 0;

    const seen = new Set();
    for (const r of returnRequests) {
      if (seen.has(r.saleOrderItemId)) {
        const err = new Error(`Duplicate item ${r.saleOrderItemId} in return request`);
        err.code = 'DUPLICATE_RETURN_ITEM';
        throw err;
      }
      seen.add(r.saleOrderItemId);

      const item = itemMap[r.saleOrderItemId];
      if (!item) {
        const err = new Error(`Sale item ${r.saleOrderItemId} not found in this order`);
        err.code = 'RETURN_ITEM_NOT_FOUND';
        throw err;
      }

      const remaining = item.quantity - item.returnedQty;
      if (r.returnQty > remaining || r.returnQty <= 0) {
        const err = new Error(`Invalid return quantity for "${item.productName}". Max returnable: ${remaining}`);
        err.code = 'INVALID_RETURN_QTY';
        throw err;
      }

      if (!item.isService) {
        await incrementStock(tx, item.productId, r.returnQty, userId, STOCK_REFERENCE_MODELS.SALE_ORDER, sale.id, MOVEMENT_TYPES.RETURN_FROM_CUSTOMER);
      }

      await tx.saleOrderItem.update({
        where: { id: item.id },
        data: { returnedQty: { increment: r.returnQty } },
      });

      const itemRefund = (item.unitPrice - item.discount) * r.returnQty;
      totalRefund += itemRefund;

      if (sale.paymentMethod === PAYMENT_METHODS.SEMI_CREDIT) {
        creditRefund += itemRefund * (sale.amountOnCredit / sale.totalAmount);
      } else if (sale.paymentMethod === PAYMENT_METHODS.CREDIT) {
        creditRefund += itemRefund;
      }
    }

    // Calculate cash refund portion based on payment method
    if (sale.paymentMethod === PAYMENT_METHODS.CASH) {
      cashRefund = totalRefund;
    } else if (sale.paymentMethod === PAYMENT_METHODS.SEMI_CREDIT) {
      cashRefund = totalRefund * (sale.amountTendered / sale.totalAmount);
    }
    // CARD and CREDIT: cashRefund stays 0

    if (sale.customerId && creditRefund > 0) {
      const cust = await tx.customer.findUnique({
        where: { id: sale.customerId, isDeleted: false },
        select: { creditBalance: true },
      });

      if (!cust) {
        const err = new Error('Customer not found for credit reversal');
        err.code = 'CUSTOMER_NOT_FOUND';
        throw err;
      }

      await tx.customer.update({
        where: { id: sale.customerId },
        data: { creditBalance: { decrement: creditRefund } },
      });

      const custAfter = await tx.customer.findUnique({
        where: { id: sale.customerId },
        select: { creditBalance: true },
      });

      await tx.creditTransaction.create({
        data: {
          type: CREDIT_TRANSACTION_TYPES.ADJUSTED,
          amount: creditRefund,
          balanceBefore: custAfter.creditBalance + creditRefund,
          balanceAfter: custAfter.creditBalance,
          customerId: sale.customerId,
          saleOrderId: sale.id,
          createdById: userId,
          note: `Return: ${returnReason || 'No reason provided'}`,
        },
      });
    }

    const updated = await tx.saleOrder.findUnique({
      where: { id },
      include: saleInclude,
    });

    return { sale: updated, totalRefund, creditRefund, cashRefund };
  });
};
