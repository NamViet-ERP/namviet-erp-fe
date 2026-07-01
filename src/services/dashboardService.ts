import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';

export interface TopProductApiDto {
  sku: string;
  name: string;
  qty: number;
  value: number;
}

const ENDPOINT = '/api/dashboard';

export const dashboardService = {
  async topProducts(): Promise<TopProductApiDto[]> {
    return resolveMock(
      () => import('../mocks/services/dashboardService.mock').then((m) => m.topProductsMock()),
      () => apiClient.get<TopProductApiDto[]>(`${ENDPOINT}/top-products`),
    );
  },

  async topMaterials(): Promise<TopProductApiDto[]> {
    return resolveMock(
      () => import('../mocks/services/dashboardService.mock').then((m) => m.topMaterialsMock()),
      () => apiClient.get<TopProductApiDto[]>(`${ENDPOINT}/top-materials`),
    );
  },
};
