import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { User, ShiftSummary } from '../types/models';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateUserPayload {
  fullName: string;
  username: string;
  password: string;
  role: string;
  phone?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  isActive?: boolean;
}

export const getUsers = async (params: UserListParams = {}): Promise<PaginatedResponse<User>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<User>>('/users', { params });
  return data;
};

export const getUser = async (id: number): Promise<User> => {
  const { data } = await axiosInstance.get<ApiResponse<User>>(`/users/${id}`);
  return data.data!;
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const { data } = await axiosInstance.post<ApiResponse<User>>('/users', payload);
  return data.data!;
};

export const updateUser = async (id: number, payload: UpdateUserPayload): Promise<User> => {
  const { data } = await axiosInstance.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return data.data!;
};

export const deleteUser = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/users/${id}`);
};

export const clockIn = async (id: number): Promise<User> => {
  const { data } = await axiosInstance.post<ApiResponse<User>>(`/users/${id}/clock-in`);
  return data.data!;
};

export const clockOut = async (id: number): Promise<{ user: User; shiftSummary: ShiftSummary }> => {
  const { data } = await axiosInstance.post<ApiResponse<{ user: User; shiftSummary: ShiftSummary }>>(`/users/${id}/clock-out`);
  return data.data!;
};

export const getShiftSummary = async (id: number, shiftRecordId?: number): Promise<ShiftSummary> => {
  const { data } = await axiosInstance.get<ApiResponse<ShiftSummary>>(`/users/${id}/shift-summary`, {
    params: shiftRecordId ? { shiftRecordId } : {},
  });
  return data.data!;
};
