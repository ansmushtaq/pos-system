import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { PurchaseOrder } from '../types/models';

export interface POListParams {
  page?: number;
  limit?: number;
  vendorId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface POItemPayload {
  productId: number;
  orderedQty: number;
  unitCost: number;
}

export interface CreatePOPayload {
  vendorId: number;
  items: POItemPayload[];
  notes?: string;
}

export interface UpdatePOPayload {
  vendorId?: number;
  notes?: string;
  status?: string;
  orderedAt?: string;
}

export interface ReceiveItemPayload {
  itemId: number;
  receivedQty: number;
}

export interface ReceiveItemsPayload {
  items: ReceiveItemPayload[];
}

export const getPOs = async (params: POListParams = {}): Promise<PaginatedResponse<PurchaseOrder>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params });
  return data;
};

export const getPO = async (id: number): Promise<PurchaseOrder> => {
  const { data } = await axiosInstance.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
  return data.data!;
};

export const createPO = async (payload: CreatePOPayload): Promise<PurchaseOrder> => {
  const { data } = await axiosInstance.post<ApiResponse<PurchaseOrder>>('/purchase-orders', payload);
  return data.data!;
};

export const updatePO = async (id: number, payload: UpdatePOPayload): Promise<PurchaseOrder> => {
  const { data } = await axiosInstance.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, payload);
  return data.data!;
};

export const updatePOItems = async (id: number, items: POItemPayload[]): Promise<PurchaseOrder> => {
  const { data } = await axiosInstance.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/items`, { items });
  return data.data!;
};

export const deletePO = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/purchase-orders/${id}`);
};

export const receivePOItems = async (id: number, payload: ReceiveItemsPayload): Promise<PurchaseOrder> => {
  const { data } = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`, payload);
  return data.data!;
};
