import { useState } from 'react';
import { Minus, Plus, Trash2, Edit3 } from 'lucide-react';
import { useCartStore, type CartItem as CartItemType } from '../../store/cartStore';
import { PasscodeModal } from '../../components/PasscodeModal';
import { formatCurrency } from '../../utils/formatCurrency';

export const CartItemRow = ({ item }: { item: CartItemType }) => {
  const { updateQuantity, updateUnitPrice, removeItem } = useCartStore();
  const [showPasscode, setShowPasscode] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [priceOverrideToken, setPriceOverrideToken] = useState<string | undefined>();

  const handlePriceClick = () => {
    setShowPasscode(true);
  };

  const handlePriceEdit = (newPrice: number) => {
    if (newPrice > 0) {
      updateUnitPrice(item.productId, newPrice, priceOverrideToken);
    }
    setEditingPrice(false);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.productName}</p>
        <p className="text-xs text-gray-400">{item.sku}</p>
        {item.isPriceOverridden && (
          <span className="text-xs text-amber-600">Price overridden</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => item.quantity > 1 ? updateQuantity(item.productId, item.quantity - 1) : removeItem(item.productId)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="w-24 text-right">
        {editingPrice ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handlePriceEdit(Number(priceInput)); }}
            className="flex items-center gap-1"
          >
            <input
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-20 px-1 py-0.5 border rounded text-sm text-right"
              autoFocus
              onBlur={() => setEditingPrice(false)}
            />
          </form>
        ) : (
          <button onClick={handlePriceClick} className="text-sm font-medium hover:text-blue-600 flex items-center gap-1 ml-auto">
            {formatCurrency(item.unitPrice)}
            <Edit3 size={10} className="text-gray-300" />
          </button>
        )}
      </div>

      <p className="w-24 text-right text-sm font-medium">
        {formatCurrency(item.totalPrice)}
      </p>

      <button onClick={() => removeItem(item.productId)} className="p-1 hover:bg-red-50 text-red-400 rounded">
        <Trash2 size={14} />
      </button>

      {showPasscode && (
        <PasscodeModal
          module="PRICE_OVERRIDE"
          onSuccess={(result) => {
            setShowPasscode(false);
            setPriceOverrideToken(result.passcodeToken);
            setEditingPrice(true);
            setPriceInput(String(item.unitPrice));
          }}
          onCancel={() => setShowPasscode(false)}
        />
      )}
    </div>
  );
};
