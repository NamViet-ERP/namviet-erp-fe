import { mockDelay } from '../index';
import { MOCK_TOP_MATERIALS, MOCK_TOP_PRODUCTS } from '../data/wmsDashboardMock';
import type { TopProductApiDto } from '../../services/dashboardService';

export async function topProductsMock(): Promise<TopProductApiDto[]> {
  return mockDelay(MOCK_TOP_PRODUCTS);
}

export async function topMaterialsMock(): Promise<TopProductApiDto[]> {
  return mockDelay(MOCK_TOP_MATERIALS);
}
