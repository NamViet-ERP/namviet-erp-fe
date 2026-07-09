import { useMemo } from 'react';
import { buildFrozenProjectMap } from '../lib/wms/stocktakeFreeze';
import { useStocktakes } from './useStocktakes';

export function useFrozenProjects() {
  const { data: stocktakes = [] } = useStocktakes();
  return useMemo(() => buildFrozenProjectMap(stocktakes), [stocktakes]);
}
