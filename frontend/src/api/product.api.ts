import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Product } from '../types/models';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  barcode?: string;
  unit?: string;
  purchasePrice: number;
  purchaseTaxPercent?: number;
  salePrice: number;
  description?: string;
  categoryId: number;
  vendorId?: number;
  reorderLevel?: number;
  isService?: boolean;
  expiryTracking?: boolean;
  requiresPrescription?: boolean;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  isActive?: boolean;
}

export interface UpdatePricePayload {
  purchasePrice: number;
  purchaseTaxPercent: number;
  salePrice: number;
  changeReason?: string;
}

export interface PriceHistoryEntry {
  id: number;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  oldPurchaseTaxPercent: number;
  newPurchaseTaxPercent: number;
  oldCostPrice: number;
  newCostPrice: number;
  oldSalePrice: number;
  newSalePrice: number;
  changeReason?: string;
  effectiveFrom: string;
  createdAt: string;
  productId: number;
  changedById: number;
  changedBy: { id: number; fullName: string };
}

export const getProducts = async (params: ProductListParams = {}): Promise<PaginatedResponse<Product>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<Product>>('/products', { params });
  return data;
};

export const getProduct = async (id: number): Promise<Product> => {
  const { data } = await axiosInstance.get<ApiResponse<Product>>(`/products/${id}`);
  return data.data!;
};

export const createProduct = async (payload: CreateProductPayload): Promise<Product> => {
  const { data } = await axiosInstance.post<ApiResponse<Product>>('/products', payload);
  return data.data!;
};

export const updateProduct = async (id: number, payload: UpdateProductPayload): Promise<Product> => {
  const { data } = await axiosInstance.patch<ApiResponse<Product>>(`/products/${id}`, payload);
  return data.data!;
};

export const updateProductPrice = async (id: number, payload: UpdatePricePayload): Promise<Product> => {
  const { data } = await axiosInstance.put<ApiResponse<Product>>(`/products/${id}/price`, payload);
  return data.data!;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/products/${id}`);
};

export const getPriceHistory = async (productId: number): Promise<PriceHistoryEntry[]> => {
  const { data } = await axiosInstance.get<ApiResponse<PriceHistoryEntry[]>>(`/products/${productId}/price-history`);
  return data.data!;
};
