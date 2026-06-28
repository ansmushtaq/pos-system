import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Customer, CreditTransaction } from '../types/models';

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {
  isActive?: boolean;
}

export interface PayCreditPayload {
  amount: number;
  note?: string;
}

export const getCustomers = async (params: CustomerListParams = {}): Promise<PaginatedResponse<Customer>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<Customer>>('/customers', { params });
  return data;
};

export const getCustomer = async (id: number): Promise<Customer> => {
  const { data } = await axiosInstance.get<ApiResponse<Customer>>(`/customers/${id}`);
  return data.data!;
};

export const createCustomer = async (payload: CreateCustomerPayload): Promise<Customer> => {
  const { data } = await axiosInstance.post<ApiResponse<Customer>>('/customers', payload);
  return data.data!;
};

export const updateCustomer = async (id: number, payload: UpdateCustomerPayload): Promise<Customer> => {
  const { data } = await axiosInstance.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);
  return data.data!;
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/customers/${id}`);
};

export const payCredit = async (id: number, payload: PayCreditPayload): Promise<Customer> => {
  const { data } = await axiosInstance.post<ApiResponse<Customer>>(`/customers/${id}/credit/pay`, payload);
  return data.data!;
};

export const getCreditHistory = async (id: number, params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<CreditTransaction>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<CreditTransaction>>(`/customers/${id}/credit-history`, { params });
  return data;
};
