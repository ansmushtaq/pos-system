import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const getSeedSecret = (envName, generator) => {
  const value = process.env[envName];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envName} is required when running seeds in production`);
  }
  const generated = generator();
  console.warn(`${envName} was not set. Generated development value: ${generated}`);
  return generated;
};

// Minimal seeder — one row per table so all columns exist
// Run: npx prisma db seed  (after switching package.json seed to this file)

async function main() {
  console.log('Seeding minimal data (1 row per table)...\n');

  // ── Counters ──
  await prisma.counter.upsert({ where: { name: 'invoice' }, create: { name: 'invoice', value: 0 }, update: {} });
  await prisma.counter.upsert({ where: { name: 'po' }, create: { name: 'po', value: 0 }, update: {} });
  console.log('Counters');

  // ── AppSettings ──
  await prisma.appSettings.upsert({
    where: { id: 'settings' },
    create: { id: 'settings', shopName: 'My Shop', shopType: 'GENERAL', defaultTaxPercent: 0 },
    update: {},
  });
  console.log('AppSettings');

  // ── Passcode ──
  const seedPin = getSeedSecret('POS_SEED_END_OF_DAY_PIN', () => String(crypto.randomInt(100000, 1000000)));
  const pinHash = await bcrypt.hash(seedPin, 10);
  await prisma.passcode.upsert({
    where: { module: 'END_OF_DAY' },
    create: { module: 'END_OF_DAY', hash: pinHash, isEnabled: true },
    update: {},
  });
  console.log('Passcode');

  // ── Admin user ──
  const adminPassword = getSeedSecret('POS_SEED_ADMIN_PASSWORD', () => crypto.randomBytes(12).toString('base64url'));
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    create: { fullName: 'Admin', username: 'admin', passwordHash: adminHash, role: 'ADMIN' },
    update: {},
  });
  console.log('User (admin)');

  // ── Category ──
  const cat = await prisma.category.upsert({
    where: { id: 1 },
    create: { name: 'General' },
    update: {},
  });
  console.log('Category');

  // ── Product ──
  const product = await prisma.product.upsert({
    where: { sku: 'ITEM-001' },
    create: {
      name: 'Sample Item', sku: 'ITEM-001', unit: 'PCS',
      purchasePrice: 80, purchaseTaxPercent: 0, costPrice: 80, salePrice: 100,
      categoryId: cat.id, createdById: admin.id,
    },
    update: {},
  });
  console.log('Product');

  // ── Inventory ──
  await prisma.inventory.upsert({
    where: { productId: product.id },
    create: { productId: product.id, quantityOnHand: 50, reorderLevel: 10 },
    update: {},
  });
  console.log('Inventory');

  // ── StockMovement ──
  await prisma.stockMovement.create({
    data: {
      movementType: 'OPENING_STOCK', quantity: 50, quantityBefore: 0, quantityAfter: 50,
      productId: product.id, performedById: admin.id,
    },
  });
  console.log('StockMovement');

  // ── PriceHistory ──
  await prisma.productPriceHistory.create({
    data: {
      productId: product.id, changedById: admin.id,
      oldPurchasePrice: 80, newPurchasePrice: 80,
      oldPurchaseTaxPercent: 0, newPurchaseTaxPercent: 0,
      oldCostPrice: 80, newCostPrice: 80,
      oldSalePrice: 100, newSalePrice: 100,
    },
  });
  console.log('PriceHistory');

  // ── Vendor ──
  const vendor = await prisma.vendor.create({
    data: { name: 'Sample Vendor', phone: '0300-0000000', createdById: admin.id },
  });
  console.log('Vendor');

  // ── PurchaseOrder + PO Item ──
  await prisma.counter.upsert({ where: { name: 'po' }, create: { name: 'po', value: 1 }, update: { value: 1 } });
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-20260101-0001', vendorId: vendor.id, totalAmount: 800,
      createdById: admin.id,
      items: { create: [{ productId: product.id, productName: product.name, orderedQty: 10, unitCost: 80, totalCost: 800 }] },
    },
  });
  console.log('PurchaseOrder + Item');

  // ── Customer ──
  const customer = await prisma.customer.create({
    data: { name: 'Walk-in Customer', phone: '0300-1111111', createdById: admin.id },
  });
  console.log('Customer');

  // ── SaleOrder + SaleOrderItem ──
  await prisma.counter.upsert({ where: { name: 'invoice' }, create: { name: 'invoice', value: 1 }, update: { value: 1 } });
  const sale = await prisma.saleOrder.create({
    data: {
      invoiceNumber: 'INV-20260101-0001', customerName: customer.name, customerId: customer.id,
      subTotal: 100, totalAmount: 100, totalProfit: 20, totalCost: 80,
      paymentMethod: 'CASH', amountTendered: 100, sellerId: admin.id,
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, quantity: 1, unitPrice: 100, costPrice: 80, originalUnitPrice: 100, totalPrice: 100, profitAmount: 20 }] },
    },
  });
  console.log('SaleOrder + Item');

  // ── ShiftRecord ──
  await prisma.shiftRecord.create({
    data: { userId: admin.id, startedAt: new Date(), endedAt: new Date(), totalSales: 100, totalTransactions: 1 },
  });
  console.log('ShiftRecord');

  // ── CreditTransaction ──
  await prisma.creditTransaction.create({
    data: {
      type: 'ISSUED', amount: 200, balanceBefore: 0, balanceAfter: 200,
      customerId: customer.id, saleOrderId: sale.id, createdById: admin.id,
    },
  });
  console.log('CreditTransaction');

  // ── EndOfDaySummary ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.endOfDaySummary.create({
    data: {
      date: today, periodStart: today, periodEnd: new Date(),
      totalTransactions: 1, totalRevenue: 100, totalProfit: 20, totalCost: 80,
      openingCash: 500, cashSales: 100, expectedClosingCash: 600, actualClosingCash: 600,
      generatedById: admin.id,
    },
  });
  console.log('EndOfDaySummary');

  console.log('\nDone. All tables have at least one row.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
