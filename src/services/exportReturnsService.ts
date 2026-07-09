import type { ExportReturn, ExportReturnableExport, ExportReturnableLine } from '../types';
import { apiClient } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';

export type CreateExportReturnDto = Omit<
  ExportReturn,
  'id' | 'voucherCode' | 'date' | 'createdAt' | 'approvedBy' | 'approvedAt' | 'projectName' | 'createdBy'
> & { createdBy?: string };

const ENDPOINT = '/api/export-returns';

export const exportReturnsService = {
  async list(params?: VoucherListParams): Promise<ExportReturn[]> {
    return apiClient.get<ExportReturn[]>(appendVoucherDateQuery(ENDPOINT, params));
  },

  async listReturnableExports(
    projectCode: string,
    excludeReturnId?: string,
  ): Promise<ExportReturnableExport[]> {
    const qs = new URLSearchParams({ projectCode });
    if (excludeReturnId) qs.set('excludeReturnId', excludeReturnId);
    return apiClient.get<ExportReturnableExport[]>(`${ENDPOINT}/returnable-exports?${qs}`);
  },

  async getReturnableLines(
    sourceExportId: string,
    excludeReturnId?: string,
  ): Promise<ExportReturnableLine[]> {
    const qs = new URLSearchParams({ sourceExportId });
    if (excludeReturnId) qs.set('excludeReturnId', excludeReturnId);
    return apiClient.get<ExportReturnableLine[]>(`${ENDPOINT}/returnable-lines?${qs}`);
  },

  async create(dto: CreateExportReturnDto): Promise<ExportReturn> {
    return apiClient.post<ExportReturn>(ENDPOINT, dto);
  },

  async update(id: string, dto: CreateExportReturnDto): Promise<ExportReturn> {
    return apiClient.put<ExportReturn>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<ExportReturn> {
    return apiClient.post<ExportReturn>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<ExportReturn> {
    return apiClient.post<ExportReturn>(`${ENDPOINT}/${id}/submit`);
  },
};
