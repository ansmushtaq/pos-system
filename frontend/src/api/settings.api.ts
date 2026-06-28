import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types/api';
import type { AppSettings } from '../types/models';

export const getSettings = async (): Promise<AppSettings> => {
  const { data } = await axiosInstance.get<ApiResponse<AppSettings>>('/settings');
  return data.data!;
};

export const updateSettings = async (payload: Partial<AppSettings>): Promise<AppSettings> => {
  const { data } = await axiosInstance.put<ApiResponse<AppSettings>>('/settings', payload);
  return data.data!;
};

export const verifyPasscode = async (module: string, pin: string): Promise<boolean> => {
  const { data } = await axiosInstance.post<ApiResponse<{ valid: boolean }>>('/settings/passcode/verify', { module, pin });
  return data.data?.valid ?? false;
};

export const setPasscode = async (module: string, pin: string): Promise<{ module: string; isEnabled: boolean }> => {
  const { data } = await axiosInstance.put<ApiResponse<{ module: string; isEnabled: boolean }>>('/settings/passcode', { module, pin });
  return data.data!;
};

export const disablePasscode = async (module: string): Promise<{ module: string; isEnabled: boolean }> => {
  const { data } = await axiosInstance.delete<ApiResponse<{ module: string; isEnabled: boolean }>>(`/settings/passcode/${module}`);
  return data.data!;
};

export const getPasscodesStatus = async (): Promise<{ module: string; isEnabled: boolean; updatedAt: string }[]> => {
  const { data } = await axiosInstance.get<ApiResponse<{ module: string; isEnabled: boolean; updatedAt: string }[]>>('/settings/passcodes/status');
  return data.data!;
};
