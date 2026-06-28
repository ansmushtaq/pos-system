import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { EndOfDaySummary } from '../types/models';

export interface EODListParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface GenerateEODPayload {
  openingCash: number;
  actualClosingCash: number;
  date?: string;
}

export interface TodayEODResponse {
  exists: boolean;
  summary: EndOfDaySummary | null;
}

export const getEODList = async (params: EODListParams = {}): Promise<PaginatedResponse<EndOfDaySummary>> => {
  const { data } = await axiosInstance.get<PaginatedResponse<EndOfDaySummary>>('/end-of-day', { params });
  return data;
};

export const getEODById = async (id: number): Promise<EndOfDaySummary> => {
  const { data } = await axiosInstance.get<ApiResponse<EndOfDaySummary>>(`/end-of-day/${id}`);
  return data.data!;
};

export const getTodayEOD = async (): Promise<TodayEODResponse> => {
  const { data } = await axiosInstance.get<ApiResponse<TodayEODResponse>>('/end-of-day/today');
  return data.data!;
};

export const generateEOD = async (payload: GenerateEODPayload): Promise<EndOfDaySummary> => {
  const { data } = await axiosInstance.post<ApiResponse<EndOfDaySummary>>('/end-of-day', payload);
  return data.data!;
};
