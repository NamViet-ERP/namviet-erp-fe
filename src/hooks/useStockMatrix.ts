import { useQuery } from '@tanstack/react-query';
import { stockService } from '../services/stockService';
import { queryKeys } from '../services/queryKeys';

export function useStockMatrix() {
  return useQuery({
    queryKey: queryKeys.stock.matrix,
    queryFn: () => stockService.getMatrix(),
  });
}
