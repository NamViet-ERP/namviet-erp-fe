import { apiClient } from '../lib/apiClient';
import type { WmsLowStockAlertApiDto } from '../types/api/wms/opsApi';

export type { WmsLowStockAlertApiDto } from '../types/api/wms/opsApi';

const ENDPOINT = '/api/warehouse/alerts';

export const alertsService = {
  lowStock(params: { projectCode?: string; limit?: number } = {}) {
    return apiClient.get<WmsLowStockAlertApiDto[]>(`${ENDPOINT}/low-stock`, {
      projectCode: params.projectCode || undefined,
      limit: params.limit ?? 30,
    });
  },
};
