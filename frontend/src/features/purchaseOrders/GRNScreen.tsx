import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { usePO, useReceivePOItems } from '../../hooks/usePurchaseOrders';
import { PageHeader } from '../../components/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import type { PurchaseOrderItem } from '../../types/models';

export const GRNScreen = () => {
  const { id } = useParams<{ id: string }>();
  const poId = Number(id);
  const navigate = useNavigate();
  const { data: po, isLoading } = usePO(poId);
  const receiveMutation = useReceivePOItems();
  const [received, setReceived] = useState<Record<number, number>>({});

  useEffect(() => {
    if (po?.items) {
      const init: Record<number, number> = {};
      for (const item of po.items) {
        const remaining = item.orderedQty - item.receivedQty;
        init[item.id] = remaining > 0 ? remaining : 0;
      }
      setReceived(init);
    }
  }, [po]);

  if (isLoading) return <p className="text-gray-500 text-center py-8">Loading...</p>;
  if (!po) return <p className="text-gray-500 text-center py-8">Purchase order not found</p>;

  const canReceive = po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED';

  const handleSubmit = async () => {
    const items = Object.entries(received)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const poItem = po.items.find((i) => i.id === Number(itemId));
        const remaining = poItem ? poItem.orderedQty - poItem.receivedQty : 0;
        return { itemId: Number(itemId), receivedQty: Math.min(qty, remaining) };
      });

    if (items.length === 0) return;

    try {
      await receiveMutation.mutateAsync({ id: poId, payload: { items } });
      navigate('/purchase-orders');
    } catch (err) { console.error('GRN submit error:', err); }
  };

  const setItemQty = (itemId: number, qty: number) => {
    const item = po?.items.find((i) => i.id === itemId);
    const remaining = item ? item.orderedQty - item.receivedQty : 0;
    setReceived((prev) => ({ ...prev, [itemId]: Math.max(0, Math.min(qty, remaining)) }));
  };

  return (
    <div className="p-6 max-w-2xl">
      <button onClick={() => navigate('/purchase-orders')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Purchase Orders
      </button>

      <PageHeader title="Goods Received Note" subtitle={`PO: ${po.poNumber} — ${po.vendor?.name || 'Unknown vendor'}`} />

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between text-sm">
            <span>Status: <b>{po.status}</b></span>
            <span>Total: <b>{formatCurrency(po.totalAmount)}</b></span>
          </div>
        </div>

        {!canReceive && (
          <div className="p-4 text-amber-600 text-sm bg-amber-50">
            This PO cannot receive items in its current status ({po.status}).
          </div>
        )}

        <div className="p-4 space-y-3">
          {po.items.map((item: PurchaseOrderItem) => {
            const remaining = item.orderedQty - item.receivedQty;
            const currentReceived = received[item.id] ?? 0;
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">
                    Ordered: {item.orderedQty} | Already received: {item.receivedQty} | Remaining: {remaining}
                  </p>
                </div>
                {canReceive && remaining > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max={remaining}
                      value={currentReceived} onChange={(e) => setItemQty(item.id, Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-sm text-center"
                    />
                    <p className="w-24 text-right text-sm">{formatCurrency(currentReceived * item.unitCost)}</p>
                  </div>
                )}
                {remaining <= 0 && (
                  <span className="flex items-center gap-1 text-green-600 text-sm"><Check size={14} /> Fully received</span>
                )}
              </div>
            );
          })}
        </div>

        {canReceive && (
          <div className="p-4 border-t">
            <div className="flex justify-between mb-3 text-sm">
              <span>Receiving total</span>
              <span className="font-bold">{formatCurrency(
                po.items.reduce((sum, i) => sum + (received[i.id] ?? 0) * i.unitCost, 0)
              )}</span>
            </div>
            {receiveMutation.isError && (
              <p className="text-red-500 text-sm mb-3">{((receiveMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message) || 'Failed to receive items'}</p>
            )}
            <button onClick={handleSubmit} disabled={receiveMutation.isPending}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50">
              {receiveMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
