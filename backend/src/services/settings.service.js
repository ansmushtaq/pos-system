import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { PASSCODE_MODULES } from '../config/constants.js';

const settingsSelect = {
  id: true,
  shopName: true,
  shopType: true,
  address: true,
  phone: true,
  email: true,
  logoUrl: true,
  receiptHeader: true,
  receiptFooter: true,
  showProfitOnReceipt: true,
  currencySymbol: true,
  taxLabel: true,
  defaultTaxPercent: true,
  enableExpiryTracking: true,
  enablePrescriptionField: true,
  enableServiceItems: true,
  createdAt: true,
  updatedAt: true,
};

export const getSettings = async () => {
  return prisma.appSettings.upsert({
    where: { id: 'settings' },
    create: { id: 'settings' },
    update: {},
    select: settingsSelect,
  });
};

const allowedSettingsFields = [
  'shopName', 'shopType', 'address', 'phone', 'email', 'logoUrl',
  'receiptHeader', 'receiptFooter', 'showProfitOnReceipt', 'currencySymbol',
  'taxLabel', 'defaultTaxPercent', 'enableExpiryTracking',
  'enablePrescriptionField', 'enableServiceItems',
];

export const updateSettings = async (data) => {
  const sanitized = {};
  for (const key of allowedSettingsFields) {
    if (data[key] !== undefined) sanitized[key] = data[key];
  }

  return prisma.appSettings.upsert({
    where: { id: 'settings' },
    create: { id: 'settings', ...sanitized },
    update: sanitized,
    select: settingsSelect,
  });
};

export const verifyPasscode = async (module, pin) => {
  if (!Object.values(PASSCODE_MODULES).includes(module)) {
    return { valid: false };
  }

  const passcode = await prisma.passcode.findUnique({
    where: { module },
    select: { hash: true, isEnabled: true },
  });

  if (!passcode || !passcode.isEnabled) {
    return { valid: true };
  }

  const valid = await bcrypt.compare(pin, passcode.hash);
  return { valid };
};

export const setPasscode = async (module, pin, userId) => {
  if (!Object.values(PASSCODE_MODULES).includes(module)) {
    const err = new Error('Invalid passcode module');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const hash = await bcrypt.hash(pin, 10);

  await prisma.passcode.upsert({
    where: { module },
    create: {
      module,
      hash,
      isEnabled: true,
      updatedById: userId,
    },
    update: {
      hash,
      isEnabled: true,
      updatedById: userId,
    },
  });

  return { module, isEnabled: true };
};

export const disablePasscode = async (module, userId) => {
  if (!Object.values(PASSCODE_MODULES).includes(module)) {
    const err = new Error('Invalid passcode module');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  await prisma.passcode.upsert({
    where: { module },
    create: { module, hash: '', isEnabled: false, updatedById: userId },
    update: { isEnabled: false, updatedById: userId },
  });

  return { module, isEnabled: false };
};

export const getPasscodesStatus = async () => {
  const passcodes = await prisma.passcode.findMany({
    select: { module: true, isEnabled: true, updatedAt: true },
  });
  return passcodes;
};
