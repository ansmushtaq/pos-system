import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPOs,
  getPO,
  createPO,
  updatePO,
  updatePOItems,
  deletePO,
  receivePOItems,
  type POListParams,
  type CreatePOPayload,
  type UpdatePOPayload,
  type POItemPayload,
  type ReceiveItemsPayload,
} from '../api/purchaseOrder.api';

export const usePOs = (params: POListParams = {}) =>
  useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => getPOs(params),
  });

export const usePO = (id: number) =>
  useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => getPO(id),
    enabled: !!id,
  });

export const useCreatePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePOPayload) => createPO(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });
};

export const useUpdatePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePOPayload }) => updatePO(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
};

export const useUpdatePOItems = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: number; items: POItemPayload[] }) => updatePOItems(id, items),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
};

export const useDeletePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePO(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
};

export const useReceivePOItems = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReceiveItemsPayload }) => receivePOItems(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
