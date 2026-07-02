import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { mapWarehouseDashboardFromApi } from '../lib/wms/mapWarehouseDashboardFromApi';

export function useWarehouseDashboard() {
  const query = useQuery({
    queryKey: ['dashboard', 'warehouse'],
    queryFn: async () => {
      const [kpi, trend, activity, categories] = await Promise.all([
        dashboardService.kpi(),
        dashboardService.trend(6),
        dashboardService.activityFeed(20),
        dashboardService.stockByCategory(),
      ]);
      return mapWarehouseDashboardFromApi(kpi, trend, activity, categories);
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isRefetching: query.isFetching && !query.isLoading,
  };
}
