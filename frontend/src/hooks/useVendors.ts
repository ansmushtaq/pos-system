import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  type VendorListParams,
  type CreateVendorPayload,
  type UpdateVendorPayload,
} from '../api/vendor.api';

export const useVendors = (params: VendorListParams = {}) =>
  useQuery({
    queryKey: ['vendors', params],
    queryFn: () => getVendors(params),
  });

export const useVendor = (id: number) =>
  useQuery({
    queryKey: ['vendors', id],
    queryFn: () => getVendor(id),
    enabled: !!id,
  });

export const useCreateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVendorPayload) => createVendor(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });
};

export const useUpdateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateVendorPayload }) =>
      updateVendor(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });
};

export const useDeleteVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteVendor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });
};
