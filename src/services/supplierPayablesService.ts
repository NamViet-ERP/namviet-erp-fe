import { apiClient } from '../lib/apiClient';
import type {
  SupplierPayableReportApiDto,
  SupplierPayableSnapshotApiDto,
} from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/supplier-payables';

export type SupplierPayableListParams = {
  supplierId?: number;
  status?: string;
  search?: string;
};

export const supplierPayablesService = {
  getReport(params: SupplierPayableListParams = {}) {
    return apiClient.get<SupplierPayableReportApiDto>(ENDPOINT, {
      supplierId: params.supplierId,
      status: params.status || undefined,
      search: params.search || undefined,
    });
  },

  snapshot(supplierId: number) {
    return apiClient.get<SupplierPayableSnapshotApiDto>(`${ENDPOINT}/snapshot/${supplierId}`);
  },
};
