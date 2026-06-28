import prisma from '../config/db.js';
import { CREDIT_TRANSACTION_TYPES } from '../config/constants.js';

const customerSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  creditBalance: true,
  totalSpent: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
};

export const listCustomers = async ({ page = 1, limit = 20, search, isActive }) => {
  const where = { isDeleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: customerSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total };
};

export const getCustomerById = async (id) => {
  return prisma.customer.findUnique({ where: { id, isDeleted: false }, select: customerSelect });
};

export const createCustomer = async (data, userId) => {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Customer name is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return prisma.customer.create({
    data: {
      name: data.name.trim(),
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      createdById: userId,
    },
    select: customerSelect,
  });
};

export const updateCustomer = async (id, data, userId) => {
  const existing = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('Customer not found');
    err.code = 'CUSTOMER_NOT_FOUND';
    throw err;
  }

  const updateData = { updatedById: userId };

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.customer.update({
    where: { id },
    data: updateData,
    select: customerSelect,
  });
};

export const softDeleteCustomer = async (id, userId) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { creditBalance: true, isDeleted: true },
  });

  if (!customer || customer.isDeleted) {
    const err = new Error('Customer not found');
    err.code = 'CUSTOMER_NOT_FOUND';
    throw err;
  }

  if (customer.creditBalance > 0) {
    const err = new Error('Cannot delete customer with outstanding credit balance');
    err.code = 'OUTSTANDING_CREDIT';
    throw err;
  }

  return prisma.customer.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId,
    },
    select: customerSelect,
  });
};

export const payCredit = async (customerId, amount, note, userId) => {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { id: true, creditBalance: true, isDeleted: true },
    });

    if (!customer || customer.isDeleted) {
      const err = new Error('Customer not found');
      err.code = 'CUSTOMER_NOT_FOUND';
      throw err;
    }

    if (customer.creditBalance < amount) {
      const err = new Error('Payment amount exceeds outstanding credit balance');
      err.code = 'INSUFFICIENT_CREDIT';
      throw err;
    }

    const balanceBefore = customer.creditBalance;

    const updated = await tx.customer.update({
      where: { id: customerId },
      data: { creditBalance: { decrement: amount } },
      select: customerSelect,
    });

    if (updated.creditBalance < 0) {
      const err = new Error('Payment amount exceeds outstanding credit balance');
      err.code = 'INSUFFICIENT_CREDIT';
      throw err;
    }

    const actualBalanceAfter = updated.creditBalance;
    const actualBalanceBefore = actualBalanceAfter + amount;

    await tx.creditTransaction.create({
      data: {
        type: CREDIT_TRANSACTION_TYPES.PAID,
        amount,
        balanceBefore: actualBalanceBefore,
        balanceAfter: actualBalanceAfter,
        note: note || null,
        customerId,
        createdById: userId,
      },
    });

    return updated;
  });
};

export const getCreditHistory = async (customerId, { page = 1, limit = 20 }) => {
  const where = { customerId };

  const [data, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where,
      include: {
        saleOrder: { select: { invoiceNumber: true } },
        createdBy: { select: { fullName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.creditTransaction.count({ where }),
  ]);

  return { data, total };
};
