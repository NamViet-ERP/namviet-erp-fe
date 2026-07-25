import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import { purchasingDashboardService } from '../services/purchasingDashboardService';
import type { PurchasingDashboardQueryParams } from '../types/api/purchasingDashboardApi';

/** Poll only when SignalR is down — keep a slow safety net when live. */
const POLL_OFFLINE_MS = 15_000;
const POLL_LIVE_MS = false as const;

function pollInterval(live: boolean): number | false {
  return live ? POLL_LIVE_MS : POLL_OFFLINE_MS;
}

export function usePurchasingDashboardSummary(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useQuery({
    queryKey: queryKeys.purchasingDashboard.summary(params),
    queryFn: () => purchasingDashboardService.summary(params),
    refetchInterval: pollInterval(live),
  });
}

export function usePurchasingDashboardChart(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useQuery({
    queryKey: queryKeys.purchasingDashboard.chart(params),
    queryFn: () => purchasingDashboardService.chart(params),
    refetchInterval: pollInterval(live),
  });
}

export function usePurchasingActivityFeed(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useInfiniteQuery({
    queryKey: queryKeys.purchasingDashboard.activity(params),
    queryFn: ({ pageParam }) =>
      purchasingDashboardService.activity({
        ...params,
        cursor: pageParam,
        limit: params.limit ?? 20,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
    refetchInterval: pollInterval(live),
  });
}

export function usePurchasingActivityActors(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useQuery({
    queryKey: queryKeys.purchasingDashboard.actors(params),
    queryFn: () => purchasingDashboardService.actors(params),
    refetchInterval: live ? false : POLL_OFFLINE_MS * 2,
  });
}
