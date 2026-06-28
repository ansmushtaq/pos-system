import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { SaleOrder, SaleOrderItem } from '../types/models';

export interface SaleListParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  sellerId?: number;
  search?: string;
}

export interface SaleItemPayload {
  productId: number;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CreateSalePayload {
  items: SaleItemPayload[];
  paymentMethod: 'CASH' | 'CREDIT' | 'SEMI_CREDIT' | 'CARD';
  amountTendered?: number;
  customerId?: number;
  customerName?: string;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface SaleWithItems extends SaleOrder {
  items: SaleOrderItem[];
  seller: { id: number; fullName: string };
  customer?: { id: number; name: string; phone: string };
}

export interface SaleListItem extends SaleOrder {
  seller: { id: number; fullName: string };
  customer?: { id: number; name: string };
  _count: { items: number };
  returnedAmount: number;
  netTotal: number;
}

export const getSales = async (params: SaleListParams = {}): Promise<PaginatedResponse<SaleListItem>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<SaleListItem>>('/sales', { params });
  return data;
};

export const getSale = async (id: number): Promise<SaleWithItems> => {
  const { data } = await axiosInstance.get<ApiResponse<SaleWithItems>>(`/sales/${id}`);
  return data.data!;
};

export const createSale = async (payload: CreateSalePayload): Promise<SaleWithItems> => {
  const { data } = await axiosInstance.post<ApiResponse<SaleWithItems>>('/sales', payload);
  return data.data!;
};

export const voidSale = async (id: number, voidReason: string): Promise<SaleWithItems> => {
  const { data } = await axiosInstance.post<ApiResponse<SaleWithItems>>(`/sales/${id}/void`, { voidReason });
  return data.data!;
};

export interface ReturnItemPayload {
  saleOrderItemId: number;
  returnQty: number;
}

export interface ReturnItemsPayload {
  items: ReturnItemPayload[];
  returnReason?: string;
}

export interface ReturnResult {
  sale: SaleWithItems;
  totalRefund: number;
  creditRefund: number;
  cashRefund: number;
}

export const returnItems = async (id: number, payload: ReturnItemsPayload): Promise<ReturnResult> => {
  const { data } = await axiosInstance.post<ApiResponse<ReturnResult>>(`/sales/${id}/return`, payload);
  return data.data!;
};
