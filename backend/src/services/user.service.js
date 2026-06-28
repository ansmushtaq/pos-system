import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { SALE_STATUSES } from '../config/constants.js';

const userSelect = {
  id: true,
  fullName: true,
  username: true,
  role: true,
  phone: true,
  isActive: true,
  currentShiftStart: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export const listUsers = async ({ page = 1, limit = 20, search, role, isActive }) => {
  const where = { isDeleted: false };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { fullName: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({ where: { id, isDeleted: false }, select: userSelect });
};

export const createUser = async (data, userId) => {
  if (!data.fullName || !data.fullName.trim()) {
    const err = new Error('Full name is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (!data.username || !data.username.trim()) {
    const err = new Error('Username is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (!data.password) {
    const err = new Error('Password is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      username: data.username.trim(),
      passwordHash,
      role: data.role,
      phone: data.phone || null,
      createdById: userId,
    },
    select: userSelect,
  });
};

export const updateUser = async (id, data, userId) => {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const updateData = {};

  if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
  if (data.username !== undefined) updateData.username = data.username.trim();
  if (data.role !== undefined) updateData.role = data.role;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });
};

export const softDeleteUser = async (id, userId) => {
  return prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId,
    },
    select: userSelect,
  });
};

export const clockIn = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, isDeleted: true, currentShiftStart: true },
  });

  if (!user || user.isDeleted) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('User is inactive');
    err.code = 'USER_INACTIVE';
    throw err;
  }
  if (user.currentShiftStart) {
    const err = new Error('User is already on a shift');
    err.code = 'ALREADY_ON_SHIFT';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { currentShiftStart: new Date() },
      select: userSelect,
    });

    await tx.shiftRecord.create({
      data: {
        userId,
        startedAt: updated.currentShiftStart,
      },
    });

    return updated;
  });
};

export const clockOut = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, currentShiftStart: true, isDeleted: true },
  });

  if (!user || user.isDeleted) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('User is inactive');
    err.code = 'USER_INACTIVE';
    throw err;
  }
  if (!user.currentShiftStart) {
    const err = new Error('User is not on a shift');
    err.code = 'NOT_ON_SHIFT';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const shiftRecord = await tx.shiftRecord.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    const salesAgg = await tx.saleOrder.aggregate({
      where: {
        sellerId: userId,
        status: SALE_STATUSES.COMPLETED,
        createdAt: { gte: user.currentShiftStart },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    const totalSales = salesAgg._sum.totalAmount || 0;
    const totalTransactions = salesAgg._count;

    if (shiftRecord) {
      await tx.shiftRecord.update({
        where: { id: shiftRecord.id },
        data: {
          endedAt: new Date(),
          totalSales,
          totalTransactions,
        },
      });
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { currentShiftStart: null },
      select: userSelect,
    });

    return {
      user: updated,
      shiftSummary: {
        startedAt: user.currentShiftStart,
        endedAt: new Date(),
        totalSales,
        totalTransactions,
      },
    };
  });
};

export const getShiftSummary = async (userId, shiftRecordId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, currentShiftStart: true, isDeleted: true },
  });

  if (!user || user.isDeleted) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  if (shiftRecordId) {
    const record = await prisma.shiftRecord.findUnique({
      where: { id: Number(shiftRecordId) },
    });
    if (!record || record.userId !== userId) {
      const err = new Error('Shift record not found');
      err.code = 'SHIFT_NOT_FOUND';
      throw err;
    }
    const paymentBreakdown = await getPaymentBreakdown(
      userId,
      record.startedAt,
      record.endedAt,
    );
    return {
      isOnShift: false,
      shiftRecordId: record.id,
      startedAt: record.startedAt,
      endedAt: record.endedAt,
      totalSales: record.totalSales,
      totalTransactions: record.totalTransactions,
      paymentBreakdown,
    };
  }

  if (user.currentShiftStart) {
    const now = new Date();
    const salesAgg = await prisma.saleOrder.aggregate({
      where: {
        sellerId: userId,
        status: SALE_STATUSES.COMPLETED,
        createdAt: { gte: user.currentShiftStart },
      },
      _sum: { totalAmount: true },
      _count: true,
    });
    const paymentBreakdown = await getPaymentBreakdown(
      userId,
      user.currentShiftStart,
      now,
    );
    return {
      isOnShift: true,
      startedAt: user.currentShiftStart,
      totalSales: salesAgg._sum.totalAmount || 0,
      totalTransactions: salesAgg._count,
      paymentBreakdown,
    };
  }

  return {
    isOnShift: false,
    totalSales: 0,
    totalTransactions: 0,
    paymentBreakdown: [],
  };
};

async function getPaymentBreakdown(userId, startedAt, endedAt) {
  const endFilter = endedAt || new Date();
  const results = await prisma.saleOrder.groupBy({
    by: ['paymentMethod'],
    where: {
      sellerId: userId,
      status: SALE_STATUSES.COMPLETED,
      createdAt: { gte: startedAt, lte: endFilter },
    },
    _sum: { totalAmount: true },
    _count: true,
  });
  return results.map((r) => ({
    paymentMethod: r.paymentMethod,
    count: r._count,
    total: r._sum.totalAmount || 0,
  }));
}
