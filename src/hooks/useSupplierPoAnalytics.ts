import { useQuery } from '@tanstack/react-query';
import { supplierPoAnalyticsService } from '../services/supplierPoAnalyticsService';
import { queryKeys } from '../services/queryKeys';

export function useSupplierSpend() {
  return useQuery({
    queryKey: queryKeys.supplierSpend.all,
    queryFn: () => supplierPoAnalyticsService.getSpend(),
  });
}

export function useSupplierPriceHistory() {
  return useQuery({
    queryKey: queryKeys.supplierPriceHistory.all,
    queryFn: () => supplierPoAnalyticsService.getPriceHistory(),
  });
}
