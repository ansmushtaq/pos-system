import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Inventory, InventoryWithProduct, StockMovementWithRelations } from '../types/models';

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  lowStock?: boolean;
}

export interface StockMovementParams {
  page?: number;
  limit?: number;
  movementType?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdjustStockPayload {
  productId: number;
  movementType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: number;
  notes?: string;
}

export const getInventories = async (
  params: InventoryListParams = {}
): Promise<PaginatedResponse<InventoryWithProduct>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<InventoryWithProduct>>(
    '/inventory',
    { params }
  );
  return data;
};

export const getInventory = async (
  productId: number
): Promise<Inventory> => {
  const { data } = await axiosInstance.get<ApiResponse<Inventory>>(
    `/inventory/${productId}`
  );
  return data.data!;
};

export const getStockMovements = async (
  productId: number,
  params: StockMovementParams = {}
): Promise<PaginatedResponse<StockMovementWithRelations>> => {
  const { data } = await axiosInstance.get<
    PaginatedResponse<StockMovementWithRelations>
  >(`/inventory/${productId}/movements`, { params });
  return data;
};

export const getAllStockMovements = async (
  params: StockMovementParams = {}
): Promise<PaginatedResponse<StockMovementWithRelations>> => {
  const { data } = await axiosInstance.get<
    PaginatedResponse<StockMovementWithRelations>
  >('/inventory/movements', { params });
  return data;
};

export const adjustStock = async (
  payload: AdjustStockPayload
): Promise<Inventory> => {
  const { data } = await axiosInstance.post<ApiResponse<Inventory>>(
    '/inventory/adjust',
    payload
  );
  return data.data!;
};
