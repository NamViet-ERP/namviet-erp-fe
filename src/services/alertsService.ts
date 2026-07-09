import { apiClient } from '../lib/apiClient';

export interface WmsLowStockAlertApiDto {
  projectCode: string;
  projectName: string;
  materialCode: string;
  materialName: string;
  unit: string;
  actualQty: number;
  minStockQty: number;
  shortageQty: number;
}

const ENDPOINT = '/api/warehouse/alerts';

export const alertsService = {
  lowStock(params: { projectCode?: string; limit?: number } = {}) {
    return apiClient.get<WmsLowStockAlertApiDto[]>(`${ENDPOINT}/low-stock`, {
      projectCode: params.projectCode || undefined,
      limit: params.limit ?? 30,
    });
  },
};
