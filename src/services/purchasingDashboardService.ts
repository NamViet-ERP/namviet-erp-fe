import { apiClient } from '../lib/apiClient';
import type {
  PurchasingActivityActorApiDto,
  PurchasingActivityPagedApiDto,
  PurchasingDashboardChartApiDto,
  PurchasingDashboardQueryParams,
  PurchasingDashboardSummaryApiDto,
} from '../types/api/purchasingDashboardApi';

const ENDPOINT = '/api/purchasing/dashboard';

function toQuery(params: PurchasingDashboardQueryParams = {}) {
  return {
    period: params.period,
    from: params.from,
    to: params.to,
    staffId: params.staffId,
    cursor: params.cursor,
    limit: params.limit,
  };
}

export const purchasingDashboardService = {
  summary(params: PurchasingDashboardQueryParams = {}): Promise<PurchasingDashboardSummaryApiDto> {
    return apiClient.get<PurchasingDashboardSummaryApiDto>(`${ENDPOINT}/summary`, toQuery(params));
  },

  chart(params: PurchasingDashboardQueryParams = {}): Promise<PurchasingDashboardChartApiDto> {
    return apiClient.get<PurchasingDashboardChartApiDto>(`${ENDPOINT}/chart`, toQuery(params));
  },

  activity(params: PurchasingDashboardQueryParams = {}): Promise<PurchasingActivityPagedApiDto> {
    return apiClient.get<PurchasingActivityPagedApiDto>(`${ENDPOINT}/activity`, toQuery(params));
  },

  actors(params: PurchasingDashboardQueryParams = {}): Promise<PurchasingActivityActorApiDto[]> {
    return apiClient.get<PurchasingActivityActorApiDto[]>(`${ENDPOINT}/activity/actors`, toQuery(params));
  },
};
