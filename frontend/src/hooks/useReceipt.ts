import { useQuery } from '@tanstack/react-query';
import { getReceipt } from '../api/receipt.api';

export const useReceipt = (saleId: number | null) =>
  useQuery({
    queryKey: ['receipt', saleId],
    queryFn: () => getReceipt(saleId!),
    enabled: !!saleId,
  });
