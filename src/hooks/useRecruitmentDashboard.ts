import { useQuery } from '@tanstack/react-query';
import { recruitmentDashboardService } from '../services/recruitmentDashboardService';
import { queryKeys } from '../services/queryKeys';

export function useRecruitmentDashboard(months = 6) {
  const kpi = useQuery({
    queryKey: queryKeys.recruitmentDashboard.kpi,
    queryFn: () => recruitmentDashboardService.kpi(),
  });
  const trend = useQuery({
    queryKey: [...queryKeys.recruitmentDashboard.trend, months] as const,
    queryFn: () => recruitmentDashboardService.trend(months),
  });
  const bySource = useQuery({
    queryKey: queryKeys.recruitmentDashboard.bySource,
    queryFn: () => recruitmentDashboardService.bySource(),
  });
  const byPosition = useQuery({
    queryKey: queryKeys.recruitmentDashboard.byPosition,
    queryFn: () => recruitmentDashboardService.byPosition(),
  });
  const costBySource = useQuery({
    queryKey: queryKeys.recruitmentDashboard.costBySource,
    queryFn: () => recruitmentDashboardService.costBySource(),
  });

  const isRefreshing =
    kpi.isFetching || trend.isFetching || bySource.isFetching
    || byPosition.isFetching || costBySource.isFetching;

  const sync = async () => {
    await Promise.all([
      kpi.refetch(),
      trend.refetch(),
      bySource.refetch(),
      byPosition.refetch(),
      costBySource.refetch(),
    ]);
  };

  return { kpi, trend, bySource, byPosition, costBySource, sync, isRefreshing };
}
