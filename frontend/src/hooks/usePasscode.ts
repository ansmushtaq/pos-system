import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPasscodesStatus, setPasscode, disablePasscode } from '../api/settings.api';

export const usePasscodesStatus = () =>
  useQuery({
    queryKey: ['settings', 'passcodes'],
    queryFn: () => getPasscodesStatus(),
  });

export const useSetPasscode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ module, pin }: { module: string; pin: string }) => setPasscode(module, pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'passcodes'] });
    },
  });
};

export const useDisablePasscode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (module: string) => disablePasscode(module),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'passcodes'] });
    },
  });
};
