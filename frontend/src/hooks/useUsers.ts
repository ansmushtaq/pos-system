import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  clockIn,
  clockOut,
  getShiftSummary,
  type UserListParams,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../api/user.api';

export const useUsers = (params: UserListParams = {}) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
  });

export const useUser = (id: number) =>
  useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
    },
  });
};

export const useClockIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clockIn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['shift-summary'] });
    },
  });
};

export const useClockOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clockOut(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['shift-summary'] });
    },
  });
};

export const useShiftSummary = (userId: number, shiftRecordId?: number) =>
  useQuery({
    queryKey: ['shift-summary', userId, shiftRecordId],
    queryFn: () => getShiftSummary(userId, shiftRecordId),
    enabled: !!userId,
  });
