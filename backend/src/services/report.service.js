import { startOfDay, endOfDay } from 'date-fns';
import prisma from '../config/db.js';
import { SALE_STATUSES } from '../config/constants.js';

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      const parsed = startOfDay(new Date(startDate));
      if (!isNaN(parsed.getTime())) filter.createdAt.gte = parsed;
    }
    if (endDate) {
      const parsed = endOfDay(new Date(endDate));
      if (!isNaN(parsed.getTime())) filter.createdAt.lte = parsed;
    }
  }
  return filter;
};

export const getSalesSummary = async ({ startDate, endDate }) => {
  const dateFilter = buildDateFilter(startDate, endDate);
  const completedWhere = { status: SALE_STATUSES.COMPLETED, ...dateFilter };
  const voidedWhere = { status: SALE_STATUSES.VOIDED, ...dateFilter };

  const [completedCount, voidedCount, revenueByMethod, profitAgg] = await Promise.all([
    prisma.saleOrder.count({ where: completedWhere }),
    prisma.saleOrder.count({ where: voidedWhere }),
    prisma.saleOrder.groupBy({ by: ['paymentMethod'], where: completedWhere, _sum: { totalAmount: true }, _count: true }),
    prisma.saleOrder.aggregate({ where: completedWhere, _sum: { totalAmount: true, totalProfit: true, totalCost: true } }),
  ]);

  const revenueBreakdown = {};
  for (const r of revenueByMethod) {
    revenueBreakdown[r.paymentMethod] = { total: r._sum.totalAmount || 0, count: r._count };
  }

  let totalRevenue = profitAgg._sum.totalAmount || 0;
  let totalProfit = profitAgg._sum.totalProfit || 0;
  let totalCost = profitAgg._sum.totalCost || 0;

  // Subtract returned items
  const returnedItems = await prisma.saleOrderItem.findMany({
    where: {
      returnedQty: { gt: 0 },
      saleOrder: { status: SALE_STATUSES.COMPLETED, ...dateFilter },
    },
    include: {
      saleOrder: { select: { paymentMethod: true } },
    },
  });

  for (const item of returnedItems) {
    const returnRevenue = (item.unitPrice - item.discount) * item.returnedQty;
    const returnProfit = (item.unitPrice - item.costPrice - item.discount) * item.returnedQty;
    const returnCost = item.costPrice * item.returnedQty;

    totalRevenue -= returnRevenue;
    totalProfit -= returnProfit;
    totalCost -= returnCost;

    const method = item.saleOrder.paymentMethod;
    if (revenueBreakdown[method]) {
      revenueBreakdown[method].total -= returnRevenue;
      if (revenueBreakdown[method].total < 0) revenueBreakdown[method].total = 0;
    }
  }

  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    orders: { completed: completedCount, voided: voidedCount, total: completedCount + voidedCount },
    revenue: { total: totalRevenue, profit: totalProfit, cost: totalCost, margin },
    byPaymentMethod: revenueBreakdown,
  };
};

export const getTopProducts = async ({ startDate, endDate, sortBy = 'revenue', limit = 10 }) => {
  const dateFilter = buildDateFilter(startDate, endDate);
  const sumField = sortBy === 'qty' ? 'quantity' : 'totalPrice';

  const results = await prisma.saleOrderItem.groupBy({
    by: ['productId'],
    where: { saleOrder: { status: SALE_STATUSES.COMPLETED, ...dateFilter } },
    _sum: { quantity: true, totalPrice: true, profitAmount: true },
    orderBy: { _sum: { [sumField]: 'desc' } },
    take: Math.min(parseInt(limit, 10) || 10, 50),
  });

  if (results.length === 0) return [];

  const productIds = results.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const nameMap = {};
  for (const p of products) nameMap[p.id] = p;

  // Subtract returned quantities/revenue/profit from top products
  const returnedForProducts = await prisma.saleOrderItem.findMany({
    where: {
      returnedQty: { gt: 0 },
      productId: { in: productIds },
      saleOrder: { status: SALE_STATUSES.COMPLETED, ...dateFilter },
    },
  });

  const returnByProduct = {};
  for (const ri of returnedForProducts) {
    if (!returnByProduct[ri.productId]) {
      returnByProduct[ri.productId] = { qty: 0, revenue: 0, profit: 0 };
    }
    returnByProduct[ri.productId].qty += ri.returnedQty;
    returnByProduct[ri.productId].revenue += (ri.unitPrice - ri.discount) * ri.returnedQty;
    returnByProduct[ri.productId].profit += (ri.unitPrice - ri.costPrice - ri.discount) * ri.returnedQty;
  }

  return results.map((r) => {
    const returns = returnByProduct[r.productId] || { qty: 0, revenue: 0, profit: 0 };
    return {
      productId: r.productId,
      name: nameMap[r.productId]?.name || 'Unknown',
      sku: nameMap[r.productId]?.sku || '',
      quantity: (r._sum.quantity || 0) - returns.qty,
      revenue: (r._sum.totalPrice || 0) - returns.revenue,
      profit: (r._sum.profitAmount || 0) - returns.profit,
    };
  });
};

export const getProfitBySeller = async ({ startDate, endDate }) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const results = await prisma.saleOrder.groupBy({
    by: ['sellerId'],
    where: { status: SALE_STATUSES.COMPLETED, ...dateFilter },
    _sum: { totalAmount: true, totalProfit: true, totalCost: true },
    _count: true,
    orderBy: { _sum: { totalProfit: 'desc' } },
  });

  if (results.length === 0) return [];

  const sellerIds = results.map((r) => r.sellerId);
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, fullName: true },
  });
  const nameMap = {};
  for (const s of sellers) nameMap[s.id] = s;

  // Subtract returned amounts from seller aggregates
  const returnedForSellers = await prisma.saleOrderItem.findMany({
    where: {
      returnedQty: { gt: 0 },
      saleOrder: { status: SALE_STATUSES.COMPLETED, ...dateFilter, sellerId: { in: sellerIds } },
    },
    include: { saleOrder: { select: { sellerId: true } } },
  });

  const returnBySeller = {};
  for (const ri of returnedForSellers) {
    const sid = ri.saleOrder.sellerId;
    if (!returnBySeller[sid]) returnBySeller[sid] = { revenue: 0, profit: 0, cost: 0 };
    returnBySeller[sid].revenue += (ri.unitPrice - ri.discount) * ri.returnedQty;
    returnBySeller[sid].profit += (ri.unitPrice - ri.costPrice - ri.discount) * ri.returnedQty;
    returnBySeller[sid].cost += ri.costPrice * ri.returnedQty;
  }

  return results.map((r) => {
    const returns = returnBySeller[r.sellerId] || { revenue: 0, profit: 0, cost: 0 };
    const netRevenue = (r._sum.totalAmount || 0) - returns.revenue;
    const netProfit = (r._sum.totalProfit || 0) - returns.profit;
    return {
      sellerId: r.sellerId,
      name: nameMap[r.sellerId]?.fullName || 'Unknown',
      revenue: netRevenue,
      profit: netProfit,
      cost: (r._sum.totalCost || 0) - returns.cost,
      orders: r._count,
      margin: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
    };
  });
};

export const getStockValuation = async () => {
  const products = await prisma.product.findMany({
    where: { isDeleted: false, isActive: true, category: { isDeleted: false } },
    select: {
      id: true,
      name: true,
      sku: true,
      costPrice: true,
      category: { select: { id: true, name: true } },
      inventory: { select: { quantityOnHand: true } },
    },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });

  const categoryMap = new Map();
  for (const product of products) {
    const catId = product.category?.id ?? 0;
    const catName = product.category?.name || 'Uncategorized';
    const qty = Number(product.inventory?.quantityOnHand || 0);
    const totalValue = qty * product.costPrice;

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, { categoryId: catId, categoryName: catName, productCount: 0, totalValue: 0, items: [] });
    }
    const cat = categoryMap.get(catId);
    cat.productCount++;
    cat.totalValue += totalValue;
    cat.items.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantityOnHand: qty,
      unitCost: product.costPrice,
      totalValue,
    });
  }

  const categories = Array.from(categoryMap.values());
  const grandTotal = categories.reduce((sum, c) => sum + c.totalValue, 0);

  return { categories, grandTotal };
};
