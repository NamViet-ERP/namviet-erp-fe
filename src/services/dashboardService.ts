import { apiClient } from '../lib/apiClient';

export interface TopProductApiDto {
  sku: string;
  name: string;
  qty: number;
  value: number;
}

const ENDPOINT = '/api/dashboard';

export const dashboardService = {
  async topProducts(): Promise<TopProductApiDto[]> {
    return apiClient.get<TopProductApiDto[]>(`${ENDPOINT}/top-products`);
  },

  async topMaterials(): Promise<TopProductApiDto[]> {
    return apiClient.get<TopProductApiDto[]>(`${ENDPOINT}/top-materials`);
  },
};
