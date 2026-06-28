import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { createSale, type CreateSalePayload } from '../../api/sale.api';
import { ProductSearch } from './ProductSearch';
import { Cart } from './Cart';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { queueSale, getPendingCount } from '../../utils/offlineDB';
import { useOnlineStore } from '../../store/onlineStore';

export const POSScreen = () => {
  const { items, customerId, customerName, clearCart } = useCartStore();
  const [showPayment, setShowPayment] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);
  const [offlineSaleId, setOfflineSaleId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: CreateSalePayload) => createSale(payload),
  });

  const subTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handlePayment = async (data: { paymentMethod: string; amountTendered: number; customerName: string }) => {
    const payload: CreateSalePayload = {
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount || undefined,
      })),
      paymentMethod: data.paymentMethod as CreateSalePayload['paymentMethod'],
      amountTendered: data.amountTendered,
      customerId: customerId || undefined,
      customerName: data.customerName || customerName,
    };

    try {
      const sale = await createMutation.mutateAsync(payload);
      setShowPayment(false);
      setCompletedSaleId(sale.id);
      clearCart();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (!axiosErr.response) {
        // Network error — queue offline
        const offlineId = crypto.randomUUID();
        await queueSale({ ...payload, offlineId });
        setShowPayment(false);
        setOfflineSaleId(offlineId);
        clearCart();
        getPendingCount().then((count) => useOnlineStore.getState().setPendingCount(count));
        createMutation.reset();
        return;
      }
      // Server error — tracked via mutation state (existing behavior)
    }
  };

  const handleNewSale = () => {
    setCompletedSaleId(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <ShoppingCart size={20} />
          <h1 className="text-lg font-semibold">Point of Sale</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{itemCount} items</span>
          <span className="font-bold text-lg">{formatCurrency(subTotal)}</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left: Product Search */}
        <div className="w-96 flex flex-col min-h-0 border-r bg-white p-4">
          <ProductSearch />
        </div>

        {/* Right: Cart + Actions */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            <Cart />
          </div>

          {items.length > 0 && (
            <div className="flex-shrink-0 border-t bg-white px-6 py-3 space-y-2 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{itemCount} items</span>
                <span className="font-bold text-lg">{formatCurrency(subTotal)}</span>
              </div>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Pay {formatCurrency(subTotal)}
              </button>
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          total={subTotal}
          onSubmit={handlePayment}
          onCancel={() => setShowPayment(false)}
          loading={createMutation.isPending}
          error={createMutation.isError ? ((createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create sale') : undefined}
        />
      )}

      {completedSaleId && (
        <ReceiptModal saleId={completedSaleId} onClose={handleNewSale} />
      )}

      {offlineSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <h2 className="text-lg font-semibold text-amber-700 mb-2">Sale Saved Offline</h2>
            <p className="text-sm text-gray-500 mb-1">This sale has been saved locally.</p>
            <p className="text-xs text-gray-400 mb-4">It will sync automatically when connection is restored.</p>
            <p className="text-xs font-mono text-gray-300 mb-4">{offlineSaleId}</p>
            <button
              onClick={() => setOfflineSaleId(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
