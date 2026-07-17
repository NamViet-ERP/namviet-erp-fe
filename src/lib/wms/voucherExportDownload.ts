import { apiClient, saveBlob } from '../apiClient';

export interface VoucherExportQuery {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}

export async function downloadVoucherExport(
  endpoint: string,
  fileName: string,
  params?: VoucherExportQuery,
): Promise<void> {
  const blob = await apiClient.getBlob(endpoint, {
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    status: params?.status && params.status !== 'all' ? params.status : undefined,
    search: params?.search?.trim() || undefined,
  });
  saveBlob(blob, fileName);
}
