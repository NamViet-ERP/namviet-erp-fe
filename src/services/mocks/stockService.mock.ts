import { mockDelay } from '../../lib/mock';
import { MOCK_STOCK_MATRIX } from '../../data/wmsMockSeed';
import type { StockMatrixRowApiDto } from '../../types/wms';

export async function getStockMatrixMock(): Promise<StockMatrixRowApiDto[]> {
  return mockDelay(MOCK_STOCK_MATRIX);
}
