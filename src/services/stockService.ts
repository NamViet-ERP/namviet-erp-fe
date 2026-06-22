import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay } from '../lib/mock';
import { MOCK_STOCK_MATRIX } from '../data/wmsMockSeed';
import type { StockMatrixRowApiDto } from '../types/wms';

const ENDPOINT = '/api/stock/matrix';

export const stockService = {
  async getMatrix(): Promise<StockMatrixRowApiDto[]> {
    if (USE_MOCK) return mockDelay(MOCK_STOCK_MATRIX);
    return apiClient.get<StockMatrixRowApiDto[]>(ENDPOINT);
  },
};
