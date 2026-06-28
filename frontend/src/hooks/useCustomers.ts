import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  payCredit,
  getCreditHistory,
  type CustomerListParams,
  type CreateCustomerPayload,
  type UpdateCustomerPayload,
  type PayCreditPayload,
} from '../api/customer.api';

export const useCustomers = (params: CustomerListParams = {}) =>
  useQuery({
    queryKey: ['customers', params],
    queryFn: () => getCustomers(params),
  });

export const useCustomer = (id: number) =>
  useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCustomerPayload }) =>
      updateCustomer(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
};

export const usePayCredit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PayCreditPayload }) =>
      payCredit(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', id] });
      qc.invalidateQueries({ queryKey: ['credit-history'] });
    },
  });
};

export const useCreditHistory = (customerId: number, page: number = 1) =>
  useQuery({
    queryKey: ['credit-history', customerId, page],
    queryFn: () => getCreditHistory(customerId, { page, limit: 20 }),
    enabled: !!customerId,
  });
