import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInventories,
  getInventory,
  getStockMovements,
  getAllStockMovements,
  adjustStock,
  type InventoryListParams,
  type StockMovementParams,
  type AdjustStockPayload,
} from '../api/inventory.api';

export const useInventories = (params: InventoryListParams = {}) =>
  useQuery({
    queryKey: ['inventory', 'list', params],
    queryFn: () => getInventories(params),
  });

export const useInventory = (productId: number) =>
  useQuery({
    queryKey: ['inventory', productId],
    queryFn: () => getInventory(productId),
    enabled: !!productId,
  });

export const useStockMovements = (
  productId: number,
  params: StockMovementParams = {}
) =>
  useQuery({
    queryKey: ['inventory', productId, 'movements', params],
    queryFn: () => getStockMovements(productId, params),
    enabled: !!productId,
  });

export const useAllStockMovements = (params: StockMovementParams = {}) =>
  useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: () => getAllStockMovements(params),
  });

export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustStockPayload) => adjustStock(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory', 'list'] }),
  });
};
