import prisma from '../config/db.js';

const vendorSelect = {
  id: true,
  name: true,
  contactName: true,
  phone: true,
  email: true,
  address: true,
  balance: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true, purchaseOrders: true } },
};

export const listVendors = async ({ page = 1, limit = 20, search, isActive }) => {
  const where = { isDeleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const [data, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      select: vendorSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.vendor.count({ where }),
  ]);

  return { data, total };
};

export const getVendorById = async (id) => {
  return prisma.vendor.findUnique({ where: { id }, select: vendorSelect });
};

export const createVendor = async (data, userId) => {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Vendor name is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return prisma.vendor.create({
    data: {
      name: data.name.trim(),
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      createdById: userId,
    },
    select: vendorSelect,
  });
};

export const updateVendor = async (id, data, userId) => {
  const existing = await prisma.vendor.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('Vendor not found');
    err.code = 'VENDOR_NOT_FOUND';
    throw err;
  }

  return prisma.vendor.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      contactName: data.contactName !== undefined ? data.contactName : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      email: data.email !== undefined ? data.email : undefined,
      address: data.address !== undefined ? data.address : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
      updatedById: userId,
    },
    select: vendorSelect,
  });
};

export const softDeleteVendor = async (id, userId) => {
  const existing = await prisma.vendor.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!existing || existing.isDeleted) {
    const err = new Error('Vendor not found');
    err.code = 'VENDOR_NOT_FOUND';
    throw err;
  }

  return prisma.vendor.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId,
    },
    select: vendorSelect,
  });
};
