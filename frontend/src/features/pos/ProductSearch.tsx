import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore, type CartItem } from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Product } from '../../types/models';

export const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useProducts({ page: 1, limit: 25, search: query || undefined });
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = (product: Product) => {
    const item: CartItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.salePrice,
      originalUnitPrice: product.salePrice,
      isPriceOverridden: false,
      costPrice: product.costPrice,
      discount: 0,
      totalPrice: product.salePrice,
      profitPreview: product.salePrice - product.costPrice,
    };
    addItem(item);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search products or scan barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
          autoFocus
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4 gap-2 text-gray-400">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span className="text-sm">Searching...</span>
          </div>
        ) : data && data.data && data.data.length > 0 && query.trim() ? (
          <div className="space-y-1">
            {data.data.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAdd(product)}
                disabled={!product.isActive}
                className={`w-full text-left px-3 py-2 rounded-md border hover:border-blue-300 hover:bg-blue-50 transition-colors ${!product.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 truncate">{product.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="text-sm font-medium">{formatCurrency(product.salePrice)}</span>
                    <span className="text-xs text-gray-400">{product.inventory ? `${product.inventory.quantityOnHand} in stock` : ''}</span>
                    <Plus size={16} className="text-blue-500" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : query ? (
          <p className="text-gray-400 text-sm text-center py-4">No products found</p>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">Type to search products</p>
        )}
      </div>
    </div>
  );
};
