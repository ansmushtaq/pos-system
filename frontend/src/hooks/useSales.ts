import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSales,
  getSale,
  createSale,
  voidSale,
  type SaleListParams,
  type CreateSalePayload,
} from '../api/sale.api';

export const useSales = (params: SaleListParams = {}) =>
  useQuery({
    queryKey: ['sales', params],
    queryFn: () => getSales(params),
  });

export const useSale = (id: number) =>
  useQuery({
    queryKey: ['sales', id],
    queryFn: () => getSale(id),
    enabled: !!id,
  });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => createSale(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales'] }),
  });
};

export const useVoidSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, voidReason }: { id: number; voidReason: string }) =>
      voidSale(id, voidReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales'] }),
  });
};
