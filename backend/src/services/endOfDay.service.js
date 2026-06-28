import { startOfDay, endOfDay } from 'date-fns';
import prisma from '../config/db.js';
import { SALE_STATUSES, PAYMENT_METHODS } from '../config/constants.js';

const eodInclude = {
  generatedBy: { select: { id: true, fullName: true } },
};

export const generateEOD = async (openingCash, actualClosingCash, userId, dateInput) => {
  const today = dateInput ? startOfDay(new Date(dateInput)) : startOfDay(new Date());

  return prisma.$transaction(async (tx) => {
    // 1. If EOD already exists for this date, delete it so we can regenerate with updated data
  const existing = await tx.endOfDaySummary.findUnique({
    where: { date: today },
  });
  const isUpdate = !!existing;
  if (existing) {
    await tx.endOfDaySummary.delete({ where: { id: existing.id } });
  }

  const now = new Date();

  // 2. Aggregate completed orders for today
  const completedWhere = {
    status: SALE_STATUSES.COMPLETED,
    createdAt: { gte: today, lte: now },
  };

  const allOrdersWhere = { createdAt: { gte: today, lte: now } };

  const voidedWhere = {
    status: SALE_STATUSES.VOIDED,
    createdAt: { gte: today, lte: now },
  };

  // Count totals: all orders created today, plus voided subset
  const [totalTransactions, voidedTransactions] = await Promise.all([
    tx.saleOrder.count({ where: allOrdersWhere }),
    tx.saleOrder.count({ where: voidedWhere }),
  ]);

  // Revenue by payment method (completed only)
  const revenueByMethod = await tx.saleOrder.groupBy({
    by: ['paymentMethod'],
    where: completedWhere,
    _sum: { totalAmount: true },
  });

  let cashRevenue = 0;
  let creditRevenue = 0;
  let semiCreditRevenue = 0;
  let cardRevenue = 0;
  let totalRevenue = 0;

  for (const r of revenueByMethod) {
    const amt = r._sum.totalAmount || 0;
    totalRevenue += amt;
    if (r.paymentMethod === PAYMENT_METHODS.CASH) cashRevenue = amt;
    else if (r.paymentMethod === PAYMENT_METHODS.CREDIT) creditRevenue = amt;
    else if (r.paymentMethod === PAYMENT_METHODS.SEMI_CREDIT) semiCreditRevenue = amt;
    else if (r.paymentMethod === PAYMENT_METHODS.CARD) cardRevenue = amt;
  }

  // Aggregate profit and cost (completed only)
  const profitAgg = await tx.saleOrder.aggregate({
    where: completedWhere,
    _sum: { totalProfit: true, totalCost: true },
  });
  let totalProfit = profitAgg._sum.totalProfit || 0;
  let totalCost = profitAgg._sum.totalCost || 0;

  // cashSales = sum of amountTendered for CASH + SEMI_CREDIT completed orders
  const cashSalesAgg = await tx.saleOrder.aggregate({
    where: {
      ...completedWhere,
      paymentMethod: { in: [PAYMENT_METHODS.CASH, PAYMENT_METHODS.SEMI_CREDIT] },
    },
    _sum: { amountTendered: true },
  });
  let cashSales = cashSalesAgg._sum.amountTendered || 0;

  // Sum changeGiven across completed orders
  const changeAgg = await tx.saleOrder.aggregate({
    where: completedWhere,
    _sum: { changeGiven: true },
  });
  const changeGiven = changeAgg._sum.changeGiven || 0;

  // 4. expectedClosingCash = openingCash + cashSales - changeGiven
  let expectedClosingCash = openingCash + cashSales - changeGiven;

  // 5. cashDiscrepancy
  let cashDiscrepancy = actualClosingCash !== undefined && actualClosingCash !== null ? actualClosingCash - expectedClosingCash : null;

  // 6. newCreditIssued = sum of amountOnCredit for CREDIT + SEMI_CREDIT completed orders
  const creditAgg = await tx.saleOrder.aggregate({
    where: {
      ...completedWhere,
      paymentMethod: { in: [PAYMENT_METHODS.CREDIT, PAYMENT_METHODS.SEMI_CREDIT] },
    },
    _sum: { amountOnCredit: true },
  });
  const newCreditIssued = creditAgg._sum.amountOnCredit || 0;

  // ── Subtract returned items from today's aggregates ──────────────────────
  const returnedItems = await tx.saleOrderItem.findMany({
    where: {
      returnedQty: { gt: 0 },
      saleOrder: {
        status: SALE_STATUSES.COMPLETED,
        createdAt: { gte: today, lte: now },
      },
    },
    include: {
      saleOrder: { select: { paymentMethod: true, amountTendered: true, totalAmount: true } },
    },
  });

  let totalReturnRevenue = 0;
  let totalReturnProfit = 0;
  let totalReturnCost = 0;
  let cashRefundsToday = 0;

  for (const item of returnedItems) {
    const itemReturnRevenue = (item.unitPrice - item.discount) * item.returnedQty;
    const itemReturnProfit = (item.unitPrice - item.costPrice - item.discount) * item.returnedQty;
    const itemReturnCost = item.costPrice * item.returnedQty;

    const method = item.saleOrder.paymentMethod;
    if (method === PAYMENT_METHODS.CASH) cashRevenue -= itemReturnRevenue;
    else if (method === PAYMENT_METHODS.CREDIT) creditRevenue -= itemReturnRevenue;
    else if (method === PAYMENT_METHODS.SEMI_CREDIT) semiCreditRevenue -= itemReturnRevenue;
    else if (method === PAYMENT_METHODS.CARD) cardRevenue -= itemReturnRevenue;

    totalReturnRevenue += itemReturnRevenue;
    totalReturnProfit += itemReturnProfit;
    totalReturnCost += itemReturnCost;

    // Determine cash refund portion
    if (method === PAYMENT_METHODS.CASH) {
      cashRefundsToday += itemReturnRevenue;
    } else if (method === PAYMENT_METHODS.SEMI_CREDIT) {
      const cashPortion = item.saleOrder.totalAmount > 0
        ? item.saleOrder.amountTendered / item.saleOrder.totalAmount
        : 0;
      cashRefundsToday += itemReturnRevenue * cashPortion;
    }
  }

  // Apply return adjustments to totals
  totalRevenue -= totalReturnRevenue;
  totalProfit -= totalReturnProfit;
  totalCost -= totalReturnCost;
  cashSales -= cashRefundsToday;

  // Recompute cash reconciliation and margin with adjusted values
  expectedClosingCash = openingCash + cashSales - changeGiven;
  cashDiscrepancy = actualClosingCash !== undefined && actualClosingCash !== null
    ? actualClosingCash - expectedClosingCash
    : null;
  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // 7. Top 5 products by quantity (from SaleOrderItems of completed orders)
  const topProductsByQty = await tx.saleOrderItem.groupBy({
    by: ['productId'],
    where: {
      saleOrder: { status: SALE_STATUSES.COMPLETED, createdAt: { gte: today, lte: now } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const topQtyProductIds = topProductsByQty.map((p) => p.productId);
  const topQtyProducts = await tx.product.findMany({
    where: { id: { in: topQtyProductIds } },
    select: { id: true, name: true },
  });
  const qtyNameMap = {};
  for (const p of topQtyProducts) qtyNameMap[p.id] = p.name;

  const topProductsByQtyJson = topProductsByQty.map((p) => ({
    productId: p.productId,
    name: qtyNameMap[p.productId] || 'Unknown',
    qty: p._sum.quantity || 0,
  }));

  // Subtract returned quantities from top products by qty
  const returnedItemsByQty = await tx.saleOrderItem.findMany({
    where: {
      returnedQty: { gt: 0 },
      productId: { in: topQtyProductIds },
      saleOrder: { status: SALE_STATUSES.COMPLETED, createdAt: { gte: today, lte: now } },
    },
  });
  const returnQtyMap = {};
  for (const ri of returnedItemsByQty) {
    returnQtyMap[ri.productId] = (returnQtyMap[ri.productId] || 0) + ri.returnedQty;
  }
  for (const p of topProductsByQtyJson) {
    p.qty = Math.max(0, (p.qty || 0) - (returnQtyMap[p.productId] || 0));
  }

  // Top 5 products by revenue (totalPrice from SaleOrderItems of completed orders)
  const topProductsByRevenue = await tx.saleOrderItem.groupBy({
    by: ['productId'],
    where: {
      saleOrder: { status: SALE_STATUSES.COMPLETED, createdAt: { gte: today, lte: now } },
    },
    _sum: { totalPrice: true },
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: 5,
  });

  const topRevProductIds = topProductsByRevenue.map((p) => p.productId);
  const topRevProducts = await tx.product.findMany({
    where: { id: { in: topRevProductIds } },
    select: { id: true, name: true },
  });
  const revNameMap = {};
  for (const p of topRevProducts) revNameMap[p.id] = p.name;

  const topProductsByRevenueJson = topProductsByRevenue.map((p) => ({
    productId: p.productId,
    name: revNameMap[p.productId] || 'Unknown',
    revenue: p._sum.totalPrice || 0,
  }));

  // Subtract returned revenue from top products by revenue
  const returnedItemsByRevenue = await tx.saleOrderItem.findMany({
    where: {
      returnedQty: { gt: 0 },
      productId: { in: topRevProductIds },
      saleOrder: { status: SALE_STATUSES.COMPLETED, createdAt: { gte: today, lte: now } },
    },
  });
  const returnRevMap = {};
  for (const ri of returnedItemsByRevenue) {
    if (!returnRevMap[ri.productId]) {
      returnRevMap[ri.productId] = { revenue: 0 };
    }
    returnRevMap[ri.productId].revenue += (ri.unitPrice - ri.discount) * ri.returnedQty;
  }
  for (const p of topProductsByRevenueJson) {
    p.revenue = Math.max(0, (p.revenue || 0) - ((returnRevMap[p.productId] && returnRevMap[p.productId].revenue) || 0));
  }

  // 8. Create EndOfDaySummary
  const summary = await tx.endOfDaySummary.create({
    data: {
      date: today,
      periodStart: today,
      periodEnd: now,
      totalTransactions,
      voidedTransactions,
      cashRevenue,
      creditRevenue,
      semiCreditRevenue,
      cardRevenue,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMarginPercent,
      openingCash,
      cashSales,
      changeGiven,
      expectedClosingCash,
      actualClosingCash,
      cashDiscrepancy,
      newCreditIssued,
      topProductsByQty: topProductsByQtyJson,
      topProductsByRevenue: topProductsByRevenueJson,
      generatedById: userId,
    },
    include: eodInclude,
  });

  return summary;
  });
};

export const listEOD = async ({ page = 1, limit = 20, startDate, endDate }) => {
  const where = {};

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startOfDay(new Date(startDate));
    if (endDate) where.date.lte = endOfDay(new Date(endDate));
  }

  const [data, total] = await Promise.all([
    prisma.endOfDaySummary.findMany({
      where,
      include: eodInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.endOfDaySummary.count({ where }),
  ]);

  return { data, total };
};

export const getEODById = async (id) => {
  return prisma.endOfDaySummary.findUnique({
    where: { id },
    include: eodInclude,
  });
};

export const getTodayEOD = async () => {
  const today = startOfDay(new Date());
  return prisma.endOfDaySummary.findUnique({
    where: { date: today },
    include: eodInclude,
  });
};
