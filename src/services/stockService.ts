import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';
import type { StockMatrixRowApiDto } from '../types/wms';

const ENDPOINT = '/api/stock/matrix';

export const stockService = {
  async getMatrix(): Promise<StockMatrixRowApiDto[]> {
    return resolveMock(
      () => import('../mocks/services/stockService.mock').then((m) => m.getStockMatrixMock()),
      () => apiClient.get<StockMatrixRowApiDto[]>(ENDPOINT),
    );
  },
};
