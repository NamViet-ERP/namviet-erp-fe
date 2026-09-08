import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import {
  supplierPayablesService,
  type SupplierPayableListParams,
} from '../services/supplierPayablesService';

export function useSupplierPayables(params: SupplierPayableListParams = {}) {
  return useQuery({
    queryKey: queryKeys.supplierPayables.report(params),
    queryFn: () => supplierPayablesService.getReport(params),
    // Giữ báo cáo trước khi đổi lọc status/NCC/search → tránh skeleton làm giật layout.
    placeholderData: keepPreviousData,
  });
}

export function useSupplierPayableSnapshot(supplierId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.supplierPayables.snapshot(supplierId ?? 0),
    queryFn: () => supplierPayablesService.snapshot(supplierId as number),
    enabled: Boolean(supplierId),
  });
}
