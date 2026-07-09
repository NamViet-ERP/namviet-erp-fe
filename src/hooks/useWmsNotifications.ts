import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../services/notificationsService';

export function useWmsNotifications() {
  return useQuery({
    queryKey: ['wms-notifications', 'pending'],
    queryFn: () => notificationsService.pending(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
