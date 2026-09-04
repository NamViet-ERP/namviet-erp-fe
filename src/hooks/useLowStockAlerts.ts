import { useQuery } from '@tanstack/react-query';
import { alertsService } from '../services/alertsService';
import { queryKeys } from '../services/queryKeys';

export function useLowStockAlerts(projectCode?: string, limit = 30) {
  return useQuery({
    queryKey: queryKeys.lowStockAlerts.list(projectCode ?? '', limit),
    queryFn: () => alertsService.lowStock({ projectCode, limit }),
    staleTime: 60_000,
  });
}
