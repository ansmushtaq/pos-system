import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types/api';
import type { Category } from '../types/models';

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Category[]>>('/categories');
  return data.data ?? [];
};
