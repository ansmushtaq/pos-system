import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Vendor } from '../types/models';

export interface VendorListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateVendorPayload {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateVendorPayload extends Partial<CreateVendorPayload> {
  isActive?: boolean;
}

export const getVendors = async (params: VendorListParams = {}): Promise<PaginatedResponse<Vendor>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<Vendor>>('/vendors', { params });
  return data;
};

export const getVendor = async (id: number): Promise<Vendor> => {
  const { data } = await axiosInstance.get<ApiResponse<Vendor>>(`/vendors/${id}`);
  return data.data!;
};

export const createVendor = async (payload: CreateVendorPayload): Promise<Vendor> => {
  const { data } = await axiosInstance.post<ApiResponse<Vendor>>('/vendors', payload);
  return data.data!;
};

export const updateVendor = async (id: number, payload: UpdateVendorPayload): Promise<Vendor> => {
  const { data } = await axiosInstance.patch<ApiResponse<Vendor>>(`/vendors/${id}`, payload);
  return data.data!;
};

export const deleteVendor = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/vendors/${id}`);
};
