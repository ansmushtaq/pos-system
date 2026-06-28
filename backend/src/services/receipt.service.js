import { format } from 'date-fns';
import PDFDocument from 'pdfkit';
import prisma from '../config/db.js';
import { PAYMENT_METHODS, SALE_STATUSES } from '../config/constants.js';

/**
 * Build receipt JSON data for a given sale ID.
 * Queries the sale order with items/seller/customer and app settings.
 */
export const buildReceiptData = async (saleId) => {
  const sale = await prisma.saleOrder.findUnique({
    where: { id: saleId },
    include: {
      items: {
        select: {
          productName: true,
          sku: true,
          quantity: true,
          unitPrice: true,
          discount: true,
          totalPrice: true,
        },
      },
      seller: {
        select: { fullName: true },
      },
      customer: {
        select: { name: true },
      },
    },
  });

  if (!sale) {
    const err = new Error('Sale not found');
    err.code = 'SALE_NOT_FOUND';
    throw err;
  }

  if (sale.status === SALE_STATUSES.VOIDED) {
    const err = new Error('Cannot generate receipt for a voided sale');
    err.code = 'SALE_VOIDED';
    throw err;
  }

  const settings = await prisma.appSettings.findUnique({
    where: { id: 'settings' },
  });

  const shopName = settings?.shopName || 'My Shop';
  const shopAddress = settings?.address || null;
  const shopPhone = settings?.phone || null;
  const receiptHeader = settings?.receiptHeader || null;
  const receiptFooter = settings?.receiptFooter || 'Thank you for your business!';
  const currencySymbol = settings?.currencySymbol || 'Rs.';
  const showProfitOnReceipt = settings?.showProfitOnReceipt || false;

  return {
    shopName,
    shopAddress,
    shopPhone,
    logoUrl: settings?.logoUrl || null,
    receiptHeader,
    receiptFooter,
    currencySymbol,
    invoiceNumber: sale.invoiceNumber,
    date: format(sale.createdAt, 'yyyy-MM-dd'),
    time: format(sale.createdAt, 'HH:mm:ss'),
    cashierName: sale.seller?.fullName || '',
    customerName: sale.customerName,
    items: sale.items.map((item) => ({
      name: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      totalPrice: item.totalPrice,
    })),
    subTotal: sale.subTotal,
    discountAmount: sale.discountAmount,
    taxAmount: sale.taxAmount,
    totalAmount: sale.totalAmount,
    paymentMethod: sale.paymentMethod,
    amountTendered: sale.amountTendered,
    changeGiven: sale.changeGiven,
    amountOnCredit: sale.amountOnCredit,
    totalProfit: showProfitOnReceipt ? sale.totalProfit : null,
  };
};

/**
 * Build an ESC/POS binary buffer for thermal printer output.
 */
export const buildEscposBuffer = async (receiptData) => {
  const chunks = [];
  const write = (data) => chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8'));
  const command = (...bytes) => write(Buffer.from(bytes));
  const text = (value = '') => write(`${value}\n`);
  const align = (mode) => command(0x1b, 0x61, mode);
  const bold = (enabled) => command(0x1b, 0x45, enabled ? 1 : 0);
  const line = () => text('-'.repeat(32));

  const { currencySymbol } = receiptData;
  const fmt = (v) => `${currencySymbol} ${Number(v).toFixed(2)}`;

  command(0x1b, 0x40);
  align(1);
  text(receiptData.shopName);
  if (receiptData.shopAddress) text(receiptData.shopAddress);
  if (receiptData.shopPhone) text(receiptData.shopPhone);
  if (receiptData.receiptHeader) text(receiptData.receiptHeader);
  align(0);
  line();
  text('Invoice: ' + receiptData.invoiceNumber);
  text('Date: ' + receiptData.date + '  Time: ' + receiptData.time);
  text('Cashier: ' + receiptData.cashierName);
  text('Customer: ' + receiptData.customerName);
  line();
  text('Item          Qty  Price  Total');
  receiptData.items.forEach((item) => {
    text(item.name.length > 24 ? item.name.substring(0, 21) + '...' : item.name);
    text('  ' + item.quantity + ' x ' + fmt(item.unitPrice) + '  ' + fmt(item.totalPrice));
  });
  line();
  text('Subtotal: ' + fmt(receiptData.subTotal));
  if (receiptData.discountAmount > 0) {
    text('Discount: -' + fmt(receiptData.discountAmount));
  }
  if (receiptData.taxAmount > 0) {
    text('Tax: ' + fmt(receiptData.taxAmount));
  }
  bold(true);
  text('TOTAL: ' + fmt(receiptData.totalAmount));
  bold(false);
  line();
  text('Payment: ' + receiptData.paymentMethod);
  if ((receiptData.paymentMethod === PAYMENT_METHODS.CASH || receiptData.paymentMethod === PAYMENT_METHODS.SEMI_CREDIT) && receiptData.amountTendered > 0) {
    text('Tendered: ' + fmt(receiptData.amountTendered));
  }
  if (receiptData.paymentMethod === PAYMENT_METHODS.CASH) {
    text('Change: ' + fmt(receiptData.changeGiven));
  }
  if (receiptData.amountOnCredit > 0) {
    text('On Credit: ' + fmt(receiptData.amountOnCredit));
  }
  if (receiptData.totalProfit !== null) {
    text('Profit: ' + fmt(receiptData.totalProfit));
  }
  line();
  align(1);
  text(receiptData.receiptFooter);
  command(0x1b, 0x64, 3);
  command(0x1d, 0x56, 0);

  return Buffer.concat(chunks);
};

/**
 * Build a PDF buffer for receipt printing fallback.
 */
export const buildPdfBuffer = (receiptData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [226, 800], margin: 10 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { currencySymbol } = receiptData;
    const fmt = (v) => `${currencySymbol} ${Number(v).toFixed(2)}`;
    const pageWidth = 206; // 226 - 10 - 10 margins

    const drawSeparator = () => {
      const y = doc.y;
      doc.moveTo(10, y).lineTo(10 + pageWidth, y).stroke('#999999');
      doc.moveDown(0.5);
    };

    // Logo
    if (receiptData.logoUrl) {
      doc.image(receiptData.logoUrl, 10, doc.y, { width: pageWidth, align: 'center' });
      doc.moveDown(1);
    }

    // Header
    doc.font('Helvetica-Bold').fontSize(14).text(receiptData.shopName, { align: 'center' });
    doc.font('Helvetica').fontSize(8);

    if (receiptData.shopAddress) {
      doc.text(receiptData.shopAddress, { align: 'center' });
    }
    if (receiptData.shopPhone) {
      doc.text(receiptData.shopPhone, { align: 'center' });
    }
    if (receiptData.receiptHeader) {
      doc.text(receiptData.receiptHeader, { align: 'center' });
    }

    doc.moveDown(0.5);
    drawSeparator();

    doc.fontSize(8).text('Invoice: ' + receiptData.invoiceNumber);
    doc.text('Date: ' + receiptData.date + '  Time: ' + receiptData.time);
    doc.text('Cashier: ' + receiptData.cashierName);
    doc.text('Customer: ' + receiptData.customerName);

    doc.moveDown(0.5);
    drawSeparator();

    doc.text('Item          Qty  Price  Total');
    receiptData.items.forEach((item) => {
      doc.text(item.name.length > 24 ? item.name.substring(0, 21) + '...' : item.name);
      doc.text('  ' + item.quantity + ' x ' + fmt(item.unitPrice) + '  ' + fmt(item.totalPrice));
    });

    doc.moveDown(0.5);
    drawSeparator();

    doc.text('Subtotal: ' + fmt(receiptData.subTotal));
    if (receiptData.discountAmount > 0) {
      doc.text('Discount: -' + fmt(receiptData.discountAmount));
    }
    if (receiptData.taxAmount > 0) {
      doc.text('Tax: ' + fmt(receiptData.taxAmount));
    }

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('TOTAL: ' + fmt(receiptData.totalAmount));
    doc.font('Helvetica').fontSize(8);

    doc.moveDown(0.5);
    drawSeparator();

    doc.text('Payment: ' + receiptData.paymentMethod);
    if ((receiptData.paymentMethod === PAYMENT_METHODS.CASH || receiptData.paymentMethod === PAYMENT_METHODS.SEMI_CREDIT) && receiptData.amountTendered > 0) {
      doc.text('Tendered: ' + fmt(receiptData.amountTendered));
    }
    if (receiptData.paymentMethod === PAYMENT_METHODS.CASH) {
      doc.text('Change: ' + fmt(receiptData.changeGiven));
    }
    if (receiptData.amountOnCredit > 0) {
      doc.text('On Credit: ' + fmt(receiptData.amountOnCredit));
    }
    if (receiptData.totalProfit !== null) {
      doc.text('Profit: ' + fmt(receiptData.totalProfit));
    }

    doc.moveDown(0.5);
    drawSeparator();

    doc.text(receiptData.receiptFooter, { align: 'center' });

    doc.end();
  });
};
