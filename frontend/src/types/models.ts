export interface User {
  id: number;
  fullName: string;
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';
  phone?: string;
  isActive?: boolean;
  currentShiftStart?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  unit: string;
  purchasePrice: number;
  purchaseTaxPercent: number;
  costPrice: number;
  salePrice: number;
  description?: string;
  imageUrl?: string;
  expiryTracking: boolean;
  requiresPrescription: boolean;
  isService: boolean;
  isActive: boolean;
  isDeleted: boolean;
  categoryId: number;
  vendorId?: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string };
  inventory?: { id: number; quantityOnHand: number; reorderLevel: number };
}

export interface Category {
  id: number;
  name: string;
  isActive: boolean;
  parentCategoryId?: number;
}

export interface Inventory {
  id: number;
  quantityOnHand: number;
  reorderLevel: number;
  lastMovementAt?: string;
  productId: number;
}

export interface InventoryWithProduct extends Inventory {
  product: {
    id: number; name: string; sku: string; barcode?: string;
    unit: string; isActive: boolean; isDeleted: boolean;
    category: { id: number; name: string };
  };
}

export interface StockMovement {
  id: number;
  movementType: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceModel?: string;
  referenceId?: number;
  notes?: string;
  productId: number;
  performedById: number;
  createdAt: string;
}

export interface StockMovementWithRelations extends StockMovement {
  product: { id: number; name: string; sku: string };
  performedBy: { id: number; fullName: string };
}

export interface SaleOrder {
  id: number;
  invoiceNumber: string;
  customerName: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  totalProfit: number;
  totalCost: number;
  paymentMethod: 'CASH' | 'CREDIT' | 'SEMI_CREDIT' | 'CARD';
  amountTendered: number;
  changeGiven: number;
  amountOnCredit: number;
  status: 'COMPLETED' | 'VOIDED';
  sellerId: number;
  customerId?: number;
  createdAt: string;
}

export interface SaleOrderItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  originalUnitPrice: number;
  isPriceOverridden: boolean;
  isService: boolean;
  returnedQty: number;
  discount: number;
  totalPrice: number;
  profitAmount: number;
  saleOrderId: number;
  productId: number;
}

export interface Vendor {
  id: number;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number; purchaseOrders: number };
}

export interface PurchaseOrderItem {
  id: number;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
  productId: number;
  purchaseOrderId: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  amountPaid: number;
  orderedAt?: string;
  receivedAt?: string;
  notes?: string;
  isDeleted: boolean;
  vendorId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  vendor: { id: number; name: string };
  createdBy: { id: number; fullName: string };
  items: PurchaseOrderItem[];
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditBalance: number;
  totalSpent: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftRecord {
  id: number;
  startedAt: string;
  endedAt?: string;
  totalSales: number;
  totalTransactions: number;
  userId: number;
}

export interface ShiftSummary {
  isOnShift: boolean;
  shiftRecordId?: number;
  startedAt?: string;
  endedAt?: string;
  totalSales: number;
  totalTransactions: number;
  paymentBreakdown: { paymentMethod: string; count: number; total: number }[];
}

export interface CreditTransaction {
  id: number;
  type: 'ISSUED' | 'PAID' | 'ADJUSTED' | 'VOID_REVERSAL';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note?: string;
  customerId: number;
  saleOrderId?: number;
  saleOrder?: { invoiceNumber: string };
  createdBy?: { fullName: string };
  createdAt: string;
}

export interface EndOfDaySummary {
  id: number;
  date: string;
  periodStart: string;
  periodEnd: string;
  totalTransactions: number;
  voidedTransactions: number;
  cashRevenue: number;
  creditRevenue: number;
  semiCreditRevenue: number;
  cardRevenue: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMarginPercent: number;
  openingCash: number;
  cashSales: number;
  changeGiven: number;
  expectedClosingCash: number;
  actualClosingCash?: number;
  cashDiscrepancy?: number;
  newCreditIssued: number;
  topProductsByQty: unknown;
  topProductsByRevenue: unknown;
  generatedById: number;
  generatedBy?: { id: number; fullName: string };
  createdAt: string;
}

export interface AppSettings {
  id: string;
  shopName: string;
  shopType: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  receiptHeader?: string;
  receiptFooter: string;
  showProfitOnReceipt: boolean;
  currencySymbol: string;
  taxLabel: string;
  defaultTaxPercent: number;
  enableExpiryTracking: boolean;
  enablePrescriptionField: boolean;
  enableServiceItems: boolean;
}

export interface ReceiptItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface ReceiptData {
  shopName: string;
  shopAddress: string | null;
  shopPhone: string | null;
  logoUrl: string | null;
  receiptHeader: string | null;
  receiptFooter: string;
  currencySymbol: string;
  invoiceNumber: string;
  date: string;
  time: string;
  cashierName: string;
  customerName: string;
  items: ReceiptItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountTendered: number;
  changeGiven: number;
  amountOnCredit: number;
  totalProfit: number | null;
}
