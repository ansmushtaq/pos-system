import { format } from 'date-fns';
import { createRequire } from 'module';
import Printer from 'escpos';
import PDFDocument from 'pdfkit';
import prisma from '../config/db.js';
import { PAYMENT_METHODS, SALE_STATUSES } from '../config/constants.js';

const require = createRequire(import.meta.url);
const getPixels = require('get-pixels');

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

const loadEscposImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch logo: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get('content-type') || 'image/png';
  const pixels = await new Promise((resolve, reject) => {
    getPixels(buffer, mimeType, (err, p) => (err ? reject(err) : resolve(p)));
  });
  return new Printer.Image(pixels);
};

/**
 * Build an ESC/POS binary buffer for thermal printer output.
 */
export const buildEscposBuffer = (receiptData) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const fakeAdapter = {
      write: (buf, cb) => {
        chunks.push(buf);
        if (cb) cb(null);
      },
      close: (cb) => {
        if (cb) cb(null);
      },
    };

    const printer = new Printer(fakeAdapter, { encoding: 'UTF8' });
    const { currencySymbol } = receiptData;
    const fmt = (v) => `${currencySymbol} ${Number(v).toFixed(2)}`;

    const build = async () => {
      if (receiptData.logoUrl) {
        try {
          const image = await loadEscposImage(receiptData.logoUrl);
          printer.align('CT');
          await printer.image(image, 'd24');
        } catch {
          // Logo load failed — continue without it
        }
      }

      printer.align('CT');
      printer.text(receiptData.shopName);
      if (receiptData.shopAddress) printer.text(receiptData.shopAddress);
      if (receiptData.shopPhone) printer.text(receiptData.shopPhone);
      if (receiptData.receiptHeader) printer.text(receiptData.receiptHeader);
      printer.align('LT');
      printer.drawLine();
      printer.text('Invoice: ' + receiptData.invoiceNumber);
      printer.text('Date: ' + receiptData.date + '  Time: ' + receiptData.time);
      printer.text('Cashier: ' + receiptData.cashierName);
      printer.text('Customer: ' + receiptData.customerName);
      printer.drawLine();
      printer.text('Item          Qty  Price  Total');
      receiptData.items.forEach((item) => {
        printer.text(item.name.length > 24 ? item.name.substring(0, 21) + '...' : item.name);
        printer.text('  ' + item.quantity + ' x ' + fmt(item.unitPrice) + '  ' + fmt(item.totalPrice));
      });
      printer.drawLine();
      printer.text('Subtotal: ' + fmt(receiptData.subTotal));
      if (receiptData.discountAmount > 0) {
        printer.text('Discount: -' + fmt(receiptData.discountAmount));
      }
      if (receiptData.taxAmount > 0) {
        printer.text('Tax: ' + fmt(receiptData.taxAmount));
      }
      printer.style('B');
      printer.text('TOTAL: ' + fmt(receiptData.totalAmount));
      printer.style('NORMAL');
      printer.drawLine();
      printer.text('Payment: ' + receiptData.paymentMethod);
      if ((receiptData.paymentMethod === PAYMENT_METHODS.CASH || receiptData.paymentMethod === PAYMENT_METHODS.SEMI_CREDIT) && receiptData.amountTendered > 0) {
        printer.text('Tendered: ' + fmt(receiptData.amountTendered));
      }
      if (receiptData.paymentMethod === PAYMENT_METHODS.CASH) {
        printer.text('Change: ' + fmt(receiptData.changeGiven));
      }
      if (receiptData.amountOnCredit > 0) {
        printer.text('On Credit: ' + fmt(receiptData.amountOnCredit));
      }
      if (receiptData.totalProfit !== null) {
        printer.text('Profit: ' + fmt(receiptData.totalProfit));
      }
      printer.drawLine();
      printer.align('CT');
      printer.text(receiptData.receiptFooter);
      printer.feed(3);
      printer.cut();

      printer.flush((err) => {
        if (err) reject(err);
        else resolve(Buffer.concat(chunks));
      });
    };

    build().catch(reject);
  });
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
