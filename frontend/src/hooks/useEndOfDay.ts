import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEODList,
  getEODById,
  getTodayEOD,
  generateEOD,
  type EODListParams,
  type GenerateEODPayload,
} from '../api/endOfDay.api';

export const useEODList = (params: EODListParams = {}) =>
  useQuery({
    queryKey: ['eod', 'list', params],
    queryFn: () => getEODList(params),
  });

export const useEODById = (id: number) =>
  useQuery({
    queryKey: ['eod', id],
    queryFn: () => getEODById(id),
    enabled: !!id,
  });

export const useTodayEOD = () =>
  useQuery({
    queryKey: ['eod', 'today'],
    queryFn: () => getTodayEOD(),
  });

export const useGenerateEOD = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateEODPayload) => generateEOD(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eod'] });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['eod', 'today'] });
    },
  });
};
