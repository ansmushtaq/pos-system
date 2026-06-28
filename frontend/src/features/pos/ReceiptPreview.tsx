import { formatCurrency } from '../../utils/formatCurrency';
import type { ReceiptData } from '../../api/receipt.api';

const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  CREDIT: 'CREDIT',
  SEMI_CREDIT: 'SEMI_CREDIT',
} as const;

interface ReceiptPreviewProps {
  receipt: ReceiptData;
}

export const ReceiptPreview = ({ receipt }: ReceiptPreviewProps) => {
  const fmt = (v: number) => formatCurrency(v, receipt.currencySymbol);

  return (
    <div className="bg-white border rounded-lg p-4 font-mono text-sm max-w-xs mx-auto">
      {/* Shop Header */}
      <div className="text-center mb-2">
        {receipt.logoUrl && (
          <img src={receipt.logoUrl} alt={receipt.shopName} className="max-h-16 mx-auto mb-1 object-contain" />
        )}
        <p className="font-bold text-sm">{receipt.shopName}</p>
        {receipt.shopAddress && (
          <p className="text-gray-500">{receipt.shopAddress}</p>
        )}
        {receipt.shopPhone && (
          <p className="text-gray-500">{receipt.shopPhone}</p>
        )}
        {receipt.receiptHeader && (
          <p className="text-gray-500 italic">{receipt.receiptHeader}</p>
        )}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Sale Info */}
      <div className="space-y-0.5 mb-2">
        <p>Invoice: {receipt.invoiceNumber}</p>
        <p>Date: {receipt.date}  Time: {receipt.time}</p>
        <p>Cashier: {receipt.cashierName}</p>
        <p>Customer: {receipt.customerName}</p>
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Items */}
      <div className="space-y-1 mb-2">
        {receipt.items.map((item, idx) => (
          <div key={idx}>
            <p>{item.name}</p>
            <p className="pl-2 text-gray-500">
              {item.quantity} x {fmt(item.unitPrice)}  {fmt(item.totalPrice)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Totals */}
      <div className="space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{fmt(receipt.subTotal)}</span>
        </div>
        {receipt.discountAmount > 0 && (
          <div className="flex justify-between text-red-400">
            <span>Discount</span>
            <span>-{fmt(receipt.discountAmount)}</span>
          </div>
        )}
        {receipt.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{fmt(receipt.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t pt-1">
          <span>TOTAL</span>
          <span>{fmt(receipt.totalAmount)}</span>
        </div>
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Payment Details */}
      <div className="space-y-0.5 mb-2 text-gray-500">
        <div className="flex justify-between">
          <span>Payment</span>
          <span>{receipt.paymentMethod}</span>
        </div>
        {(receipt.paymentMethod === PAYMENT_METHOD.CASH || receipt.paymentMethod === PAYMENT_METHOD.SEMI_CREDIT) && receipt.amountTendered > 0 && (
          <div className="flex justify-between">
            <span>Cash Paid</span>
            <span>{fmt(receipt.amountTendered)}</span>
          </div>
        )}
        {receipt.paymentMethod === PAYMENT_METHOD.CASH && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{fmt(receipt.changeGiven)}</span>
          </div>
        )}
        {receipt.amountOnCredit > 0 && (
          <div className="flex justify-between text-amber-600">
            <span>On Credit</span>
            <span>{fmt(receipt.amountOnCredit)}</span>
          </div>
        )}
        {receipt.totalProfit !== null && (
          <div className="flex justify-between">
            <span>Profit</span>
            <span>{fmt(receipt.totalProfit)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Footer */}
      <div className="text-center text-gray-400">
        <p>{receipt.receiptFooter}</p>
      </div>
    </div>
  );
};
