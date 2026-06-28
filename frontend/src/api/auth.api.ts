import axiosInstance from './axiosInstance';
import type { LoginPayload, LoginResponse, ApiResponse } from '../types/api';
import type { User } from '../types/models';

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  return data.data!;
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const { data } = await axiosInstance.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
  return data.data!;
};

export const getMe = async (): Promise<User> => {
  const { data } = await axiosInstance.get<ApiResponse<{ user: User }>>('/auth/me');
  return data.data!.user;
};
