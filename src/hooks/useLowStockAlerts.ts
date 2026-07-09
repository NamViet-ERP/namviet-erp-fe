import { useQuery } from '@tanstack/react-query';
import { alertsService } from '../services/alertsService';

export function useLowStockAlerts(projectCode?: string, limit = 30) {
  return useQuery({
    queryKey: ['wms-alerts', 'low-stock', projectCode ?? '', limit],
    queryFn: () => alertsService.lowStock({ projectCode, limit }),
    staleTime: 60_000,
  });
}
