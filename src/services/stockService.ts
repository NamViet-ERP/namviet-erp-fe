import { apiClient } from '../lib/apiClient';
import type { StockMatrixRowApiDto } from '../types/wms';

const ENDPOINT = '/api/stock/matrix';

export const stockService = {
  async getMatrix(): Promise<StockMatrixRowApiDto[]> {
    return apiClient.get<StockMatrixRowApiDto[]>(ENDPOINT);
  },
};
