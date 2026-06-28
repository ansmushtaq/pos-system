import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { CartItemRow } from './CartItem';

export const Cart = () => {
  const { items, customerName } = useCartStore();

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
        <ShoppingCart size={32} className="text-gray-300" />
        <p className="text-sm">Cart is empty</p>
        <p className="text-xs text-gray-300">Search and add products to begin</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-sm text-gray-500">{itemCount} items</p>
        {customerName !== 'Walk-in Customer' && (
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{customerName}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </div>
    </div>
  );
};

export const getCartSubtotal = () => {
  const items = useCartStore.getState().items;
  return items.reduce((sum, i) => sum + i.totalPrice, 0);
};
