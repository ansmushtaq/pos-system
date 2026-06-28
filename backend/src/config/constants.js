export const ROLES = {
  ADMIN:   'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  VIEWER:  'VIEWER',
};

export const PAYMENT_METHODS = {
  CASH:        'CASH',
  CREDIT:      'CREDIT',
  SEMI_CREDIT: 'SEMI_CREDIT',
  CARD:        'CARD',
};

export const SALE_STATUSES = {
  COMPLETED: 'COMPLETED',
  VOIDED:    'VOIDED',
};

export const MOVEMENT_TYPES = {
  SALE:                 'SALE',
  SALE_VOID:            'SALE_VOID',
  PURCHASE:             'PURCHASE',
  ADJUSTMENT_IN:        'ADJUSTMENT_IN',
  ADJUSTMENT_OUT:       'ADJUSTMENT_OUT',
  RETURN_TO_VENDOR:     'RETURN_TO_VENDOR',
  RETURN_FROM_CUSTOMER: 'RETURN_FROM_CUSTOMER',
  OPENING_STOCK:        'OPENING_STOCK',
};

export const STOCK_REFERENCE_MODELS = {
  SALE_ORDER:     'SaleOrder',
  PURCHASE_ORDER: 'PurchaseOrder',
};

export const PO_STATUSES = {
  DRAFT:               'DRAFT',
  SENT:                'SENT',
  PARTIALLY_RECEIVED:  'PARTIALLY_RECEIVED',
  RECEIVED:            'RECEIVED',
  CANCELLED:           'CANCELLED',
};

export const PASSCODE_MODULES = {
  PROFIT_VIEW:    'PROFIT_VIEW',
  STOCK_ENTRY:    'STOCK_ENTRY',
  STOCK_UPDATE:   'STOCK_UPDATE',
  END_OF_DAY:     'END_OF_DAY',
  PRICE_OVERRIDE: 'PRICE_OVERRIDE',
};

export const SHOP_TYPES = {
  GENERAL:      'GENERAL',
  GROCERY:      'GROCERY',
  PHARMACY:     'PHARMACY',
  REPAIR_SHOP:  'REPAIR_SHOP',
  ENGINE_OIL:   'ENGINE_OIL',
};

export const CREDIT_TRANSACTION_TYPES = {
  ISSUED:        'ISSUED',
  PAID:          'PAID',
  ADJUSTED:      'ADJUSTED',
  VOID_REVERSAL: 'VOID_REVERSAL',
};

export const UNITS = {
  PCS:     'PCS',
  KG:      'KG',
  G:       'G',
  LITER:   'LITER',
  ML:      'ML',
  BOX:     'BOX',
  PACK:    'PACK',
  SET:     'SET',
  BOTTLE:  'BOTTLE',
  STRIP:   'STRIP',
  TABLET:  'TABLET',
  SERVICE: 'SERVICE',
};
