import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSale, returnItems as returnItemsApi } from '../../api/sale.api';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { SaleOrderItem } from '../../types/models';

interface ReturnItem {
  saleOrderItemId: number;
  returnQty: number;
}

export const SaleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const saleId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sales', saleId],
    queryFn: () => getSale(saleId),
    enabled: !!saleId,
  });

  const [returnMode, setReturnMode] = useState(false);
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState('');

  const returnMutation = useMutation({
    mutationFn: (payload: { items: ReturnItem[]; returnReason?: string }) => returnItemsApi(saleId, payload),
    onSuccess: () => {
      setReturnMode(false);
      setReturnQtys({});
      setReturnReason('');
      qc.invalidateQueries({ queryKey: ['sales', saleId] });
      qc.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  if (isLoading) return <p className="text-gray-500 text-center py-8">Loading...</p>;
  if (!sale) return <p className="text-gray-500 text-center py-8">Sale not found</p>;

  const canReturn = sale.status === 'COMPLETED' && !returnMode;

  const returnableItems = sale.items.filter((item) => {
    if (item.isService) return false;
    return item.quantity - item.returnedQty > 0;
  });

  const selectedReturnTotal = returnableItems.reduce((sum, item) => {
    const qty = returnQtys[item.id] || 0;
    return sum + (item.unitPrice - item.discount) * qty;
  }, 0);

  const totalReturnedAmount = sale.items.reduce((sum, item) => {
    return sum + (item.unitPrice - item.discount) * (item.returnedQty || 0);
  }, 0);
  const netTotal = sale.totalAmount - totalReturnedAmount;

  const handleReturnToggle = (itemId: number) => {
    setReturnQtys((prev) => {
      if (prev[itemId]) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      const item = returnableItems.find((i) => i.id === itemId);
      if (!item) return prev;
      return { ...prev, [itemId]: item.quantity - item.returnedQty };
    });
  };

  const handleQtyChange = (itemId: number, qty: number) => {
    const item = returnableItems.find((i) => i.id === itemId);
    if (!item) return;
    const max = item.quantity - item.returnedQty;
    if (qty <= 0) {
      setReturnQtys((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
    } else {
      setReturnQtys((prev) => ({ ...prev, [itemId]: Math.min(qty, max) }));
    }
  };

  const handleSubmitReturn = () => {
    const items = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ saleOrderItemId: Number(itemId), returnQty: qty }));
    if (items.length === 0) return;
    returnMutation.mutate({ items, returnReason: returnReason || undefined });
  };

  const STATUS_COLORS: Record<string, string> = { COMPLETED: 'bg-green-100 text-green-700', VOIDED: 'bg-red-100 text-red-700' };
  const METHOD_COLORS: Record<string, string> = { CASH: 'bg-green-100 text-green-700', CARD: 'bg-blue-100 text-blue-700', CREDIT: 'bg-red-100 text-red-700', SEMI_CREDIT: 'bg-orange-100 text-orange-700' };

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => navigate('/sales')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Sales
      </button>

      <PageHeader title={sale.invoiceNumber} subtitle={`${formatDate(sale.createdAt, 'datetime')} — ${sale.customerName}`} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500">Status</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[sale.status] || ''}`}>{sale.status}</span>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500">Payment</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${METHOD_COLORS[sale.paymentMethod] || ''}`}>{sale.paymentMethod}</span>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold">{formatCurrency(sale.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500">Seller</p>
          <p className="text-sm font-medium mt-1">{sale.seller?.fullName || '—'}</p>
        </div>
      </div>

      {totalReturnedAmount > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">Original Total</p>
            <p className="text-lg font-bold">{formatCurrency(sale.totalAmount)}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">Returned</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(totalReturnedAmount)}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">Net</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(netTotal)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Items</h3>
          {canReturn && returnableItems.length > 0 && (
            <button onClick={() => setReturnMode(true)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md text-sm hover:bg-amber-100">
              <RotateCcw size={14} /> Return Items
            </button>
          )}
        </div>

        {returnMode ? (
          <div className="p-4 space-y-3">
            {returnableItems.map((item) => {
              const remaining = item.quantity - item.returnedQty;
              const selected = returnQtys[item.id] || 0;
              return (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-md ${selected > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                  <input type="checkbox" checked={selected > 0} onChange={() => handleReturnToggle(item.id)} className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">
                      Sold: {item.quantity} × {formatCurrency(item.unitPrice)}
                      {item.returnedQty > 0 && <span className="text-amber-600 ml-2">({item.returnedQty} already returned)</span>}
                    </p>
                  </div>
                  {selected > 0 && (
                    <input type="number" min="1" max={remaining} value={selected} onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-sm text-center" />
                  )}
                  {selected > 0 && <p className="w-24 text-right text-sm font-medium">{formatCurrency((item.unitPrice - item.discount) * selected)}</p>}
                </div>
              );
            })}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Return Reason</label>
              <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Damaged, wrong item, customer return..." className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>

            {returnMutation.isError && (
              <p className="text-red-500 text-sm">{((returnMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message) || 'Failed to process return'}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm font-medium">Refund: {formatCurrency(selectedReturnTotal)}</p>
              <div className="flex gap-2">
                <button onClick={() => { setReturnMode(false); setReturnQtys({}); }} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
                <button onClick={handleSubmitReturn} disabled={returnMutation.isPending || Object.keys(returnQtys).length === 0}
                  className="px-4 py-1.5 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 disabled:opacity-50">
                  {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'productName', header: 'Product' },
              { key: 'quantity', header: 'Qty' },
              { key: 'unitPrice', header: 'Price', render: (i: SaleOrderItem) => formatCurrency(i.unitPrice) },
              { key: 'totalPrice', header: 'Total', render: (i: SaleOrderItem) => formatCurrency(i.totalPrice) },
              {
                key: 'returned', header: 'Returned',
                render: (i: SaleOrderItem) => (
                  <span className={i.returnedQty > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                    {i.returnedQty} / {i.quantity}
                  </span>
                ),
              },
              {
                key: 'returnedAmt', header: 'Returned Amt',
                render: (i: SaleOrderItem) => {
                  const amt = (i.unitPrice - i.discount) * (i.returnedQty || 0);
                  return amt > 0
                    ? <span className="text-amber-600 font-medium">{formatCurrency(amt)}</span>
                    : <span className="text-gray-400">{formatCurrency(0)}</span>;
                },
              },
              {
                key: 'net', header: 'Net',
                render: (i: SaleOrderItem) => {
                  const net = i.totalPrice - (i.unitPrice - i.discount) * (i.returnedQty || 0);
                  return <span className="font-medium">{formatCurrency(net)}</span>;
                },
              },
            ]}
            data={sale.items}
            keyExtractor={(i) => i.id}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(sale.subTotal)}</span></div>
          {sale.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(sale.discountAmount)}</span></div>}
          {sale.taxAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(sale.taxAmount)}</span></div>}
          <div className="flex justify-between font-bold pt-1 border-t"><span>Total</span><span>{formatCurrency(sale.totalAmount)}</span></div>
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-2">
          {sale.paymentMethod === 'CASH' && (
            <>
              <div className="flex justify-between"><span className="text-gray-500">Tendered</span><span>{formatCurrency(sale.amountTendered)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Change</span><span>{formatCurrency(sale.changeGiven)}</span></div>
            </>
          )}
          {(sale.paymentMethod === 'CREDIT' || sale.paymentMethod === 'SEMI_CREDIT') && (
            <div className="flex justify-between"><span className="text-gray-500">On Credit</span><span className="text-amber-600 font-medium">{formatCurrency(sale.amountOnCredit)}</span></div>
          )}
          {(sale as { voidReason?: string }).voidReason && <div className="flex justify-between"><span className="text-gray-500">Void Reason</span><span className="text-red-500">{(sale as { voidReason?: string }).voidReason}</span></div>}
        </div>
      </div>
    </div>
  );
};
