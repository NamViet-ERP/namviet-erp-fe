import { apiClient } from '../lib/apiClient';

export interface WmsMovementSummaryApiDto {
  importCount: number;
  importValue: number;
  exportCount: number;
  exportValue: number;
  transferCount: number;
}

export interface WmsStockReportRowApiDto {
  projectCode: string;
  projectName: string;
  materialCode: string;
  materialName: string;
  unit: string;
  qty: number;
}

export interface WmsPendingVoucherRowApiDto {
  kind: string;
  voucherCode: string;
  date: string;
  createdBy: string;
  project: string | null;
}

export interface WmsPendingReportApiDto {
  importCount: number;
  exportCount: number;
  transferCount: number;
  stocktakeCount: number;
  items: WmsPendingVoucherRowApiDto[];
}

import { downloadReportExport } from '../lib/wms/reportExportDownload';

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
