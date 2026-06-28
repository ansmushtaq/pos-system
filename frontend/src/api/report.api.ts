import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types/api';

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  sortBy?: 'qty' | 'revenue';
  limit?: number;
}

export interface SalesSummary {
  period: { startDate: string | null; endDate: string | null };
  orders: { completed: number; voided: number; total: number };
  revenue: { total: number; profit: number; cost: number; margin: number };
  byPaymentMethod: Record<string, { total: number; count: number }>;
}

export interface TopProduct {
  productId: number;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface SellerProfit {
  sellerId: number;
  name: string;
  revenue: number;
  profit: number;
  cost: number;
  orders: number;
  margin: number;
}

export const getSalesSummary = async (params: ReportParams = {}): Promise<SalesSummary> => {
  const { data } = await axiosInstance.get<ApiResponse<SalesSummary>>('/reports/sales-summary', { params });
  return data.data!;
};

export const getTopProducts = async (params: ReportParams = {}): Promise<TopProduct[]> => {
  const { data } = await axiosInstance.get<ApiResponse<TopProduct[]>>('/reports/top-products', { params });
  return data.data!;
};

export const getProfitBySeller = async (params: ReportParams = {}): Promise<SellerProfit[]> => {
  const { data } = await axiosInstance.get<ApiResponse<SellerProfit[]>>('/reports/profit-by-seller', { params });
  return data.data!;
};

export interface StockItem {
  productId: number;
  name: string;
  sku: string;
  quantityOnHand: number;
  unitCost: number;
  totalValue: number;
}

export interface StockValuationCategory {
  categoryId: number;
  categoryName: string;
  productCount: number;
  totalValue: number;
  items: StockItem[];
}

export interface StockValuation {
  categories: StockValuationCategory[];
  grandTotal: number;
}

export const getStockValuation = async (): Promise<StockValuation> => {
  const { data } = await axiosInstance.get<ApiResponse<StockValuation>>('/reports/stock-valuation');
  return data.data!;
};
