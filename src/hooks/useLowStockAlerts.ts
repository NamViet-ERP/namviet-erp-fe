import { useQuery } from '@tanstack/react-query';
import { alertsService } from '../services/alertsService';
import { queryKeys } from '../services/queryKeys';

export function useLowStockAlerts(
  projectCode?: string,
  limit = 30,
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery({
    queryKey: queryKeys.lowStockAlerts.list(projectCode ?? '', limit),
    queryFn: () => alertsService.lowStock({ projectCode, limit }),
    enabled: options?.enabled,
    staleTime: options?.staleTime ?? 60_000,
  });
}
