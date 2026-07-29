import { apiClient } from '../lib/apiClient';
import { downloadReportExport } from '../lib/wms/reportExportDownload';
import type {
  WmsMovementSummaryApiDto,
  WmsPendingReportApiDto,
  WmsStockReportRowApiDto,
} from '../types/api/wms/opsApi';

export type {
  WmsMovementSummaryApiDto,
  WmsStockReportRowApiDto,
  WmsPendingVoucherRowApiDto,
  WmsPendingReportApiDto,
} from '../types/api/wms/opsApi';

const ENDPOINT = '/api/warehouse/reports';

export const reportsService = {
  movementSummary(params: { dateFrom?: string; dateTo?: string } = {}) {
    return apiClient.get<WmsMovementSummaryApiDto>(`${ENDPOINT}/movement-summary`, {
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
    });
  },

  stock(projectCode?: string) {
    return apiClient.get<WmsStockReportRowApiDto[]>(`${ENDPOINT}/stock`, {
      projectCode: projectCode || undefined,
    });
  },

  pending() {
    return apiClient.get<WmsPendingReportApiDto>(`${ENDPOINT}/pending`);
  },

  downloadMovementSummary(params: { dateFrom?: string; dateTo?: string } = {}) {
    return downloadReportExport(`${ENDPOINT}/export/movement-summary`, 'bao-cao-nhap-xuat.xlsx', {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
  },

  downloadStock(projectCode?: string) {
    return downloadReportExport(`${ENDPOINT}/export/stock`, 'bao-cao-ton-kho.xlsx', {
      projectCode,
    });
  },

  downloadPending() {
    return downloadReportExport(`${ENDPOINT}/export/pending`, 'bao-cao-cho-duyet.xlsx');
  },
};
