import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../services/notificationsService';
import { queryKeys } from '../services/queryKeys';

export function useWmsNotifications() {
  return useQuery({
    queryKey: queryKeys.wmsNotifications.pending,
    queryFn: () => notificationsService.pending(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
