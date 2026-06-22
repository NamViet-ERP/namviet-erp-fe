import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import type { StockMatrixRowApiDto } from '../types/wms';

const ENDPOINT = '/api/stock/matrix';

export const stockService = {
  async getMatrix(): Promise<StockMatrixRowApiDto[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/stockService.mock');
      return mock.getStockMatrixMock();
    }
    return apiClient.get<StockMatrixRowApiDto[]>(ENDPOINT);
  },
};
