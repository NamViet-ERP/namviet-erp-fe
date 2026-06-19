import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay } from '../lib/mock';
import type { StockMatrixRowApiDto } from '../types/wms';

const ENDPOINT = '/api/stock/matrix';

export const stockService = {
  async getMatrix(): Promise<StockMatrixRowApiDto[]> {
    if (USE_MOCK) return mockDelay([]);
    return apiClient.get<StockMatrixRowApiDto[]>(ENDPOINT);
  },
};
