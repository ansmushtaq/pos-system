import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../api/settings.api';

export const useSettings = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000, // 5 min — settings rarely change
  });
