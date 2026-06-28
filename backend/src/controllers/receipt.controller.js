import { buildReceiptData, buildEscposBuffer, buildPdfBuffer } from '../services/receipt.service.js';
import { success, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  SALE_NOT_FOUND: 404,
  SALE_VOIDED: 400,
};

export const getReceipt = async (req, res) => {
  try {
    const receiptData = await buildReceiptData(Number(req.params.id));
    return success(res, receiptData, 'Receipt fetched');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to fetch receipt' : err.message;
    return error(res, message, status);
  }
};

export const printReceipt = async (req, res) => {
  try {
    const receiptData = await buildReceiptData(Number(req.params.id));
    const format = req.query.format === 'pdf' ? 'pdf' : 'escpos';

    if (format === 'pdf') {
      const buffer = await buildPdfBuffer(receiptData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptData.invoiceNumber}.pdf"`);
      return res.send(buffer);
    }

    const buffer = await buildEscposBuffer(receiptData);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptData.invoiceNumber}.bin"`);
    return res.send(buffer);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to print receipt' : err.message;
    return error(res, message, status);
  }
};
