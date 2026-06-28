import { create } from 'zustand';

export interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  isPriceOverridden: boolean;
  priceOverrideToken?: string;
  costPrice: number;
  discount: number;
  totalPrice: number;
  profitPreview: number;
}

interface CartState {
  items: CartItem[];
  customerId: number | null;
  customerName: string;
  sellerId: number | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateUnitPrice: (productId: number, unitPrice: number, priceOverrideToken?: string) => void;
  setCustomer: (customerId: number | null, customerName: string) => void;
  setSeller: (sellerId: number | null) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  customerId: null,
  customerName: 'Walk-in Customer',
  sellerId: null,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        const newQty = existing.quantity + item.quantity;
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: newQty, unitPrice: item.unitPrice, originalUnitPrice: item.originalUnitPrice, isPriceOverridden: item.isPriceOverridden, totalPrice: (item.unitPrice - item.discount) * newQty, profitPreview: (item.unitPrice - i.costPrice - item.discount) * newQty }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, totalPrice: (i.unitPrice - i.discount) * quantity, profitPreview: (i.unitPrice - i.costPrice - i.discount) * quantity }
          : i
      ),
    })),

  updateUnitPrice: (productId, unitPrice, priceOverrideToken) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, unitPrice, priceOverrideToken, isPriceOverridden: unitPrice !== i.originalUnitPrice, totalPrice: (unitPrice - i.discount) * i.quantity, profitPreview: (unitPrice - i.costPrice - i.discount) * i.quantity }
          : i
      ),
    })),

  setCustomer: (customerId, customerName) => set({ customerId, customerName }),

  setSeller: (sellerId) => set({ sellerId }),

  clearCart: () => set({ items: [], customerId: null, customerName: 'Walk-in Customer', sellerId: null }),
}));
