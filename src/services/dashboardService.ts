import { apiClient } from '../lib/apiClient';
import type {
  DashboardActivityApiDto,
  DashboardCategoryApiDto,
  DashboardKpiApiDto,
  DashboardTrendApiDto,
  TopProductApiDto,
} from '../types/api/wms/dashboardApi';

const ENDPOINT = '/api/dashboard';

export type { TopProductApiDto };

export const dashboardService = {
  async kpi(): Promise<DashboardKpiApiDto> {
    return apiClient.get<DashboardKpiApiDto>(`${ENDPOINT}/kpi`);
  },

  async trend(months = 6): Promise<DashboardTrendApiDto[]> {
    return apiClient.get<DashboardTrendApiDto[]>(`${ENDPOINT}/trend`, { months });
  },

  async stockByCategory(): Promise<DashboardCategoryApiDto[]> {
    return apiClient.get<DashboardCategoryApiDto[]>(`${ENDPOINT}/stock-by-category`);
  },

  async stockByProject(): Promise<DashboardCategoryApiDto[]> {
    return apiClient.get<DashboardCategoryApiDto[]>(`${ENDPOINT}/stock-by-project`);
  },

  async activityFeed(limit = 20): Promise<DashboardActivityApiDto[]> {
    return apiClient.get<DashboardActivityApiDto[]>(`${ENDPOINT}/activity-feed`, { limit });
  },

  async topProducts(): Promise<TopProductApiDto[]> {
    return apiClient.get<TopProductApiDto[]>(`${ENDPOINT}/top-products`);
  },

  async topMaterials(): Promise<TopProductApiDto[]> {
    return apiClient.get<TopProductApiDto[]>(`${ENDPOINT}/top-materials`);
  },
};
