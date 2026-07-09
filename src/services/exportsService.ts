import type { Export } from '../types';
import { apiClient } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';

export type CreateExportDto = Omit<Export, 'id' | 'createdBy'> & { createdBy?: string };
export type UpdateExportDto = Partial<CreateExportDto>;

const ENDPOINT = '/api/exports';

export const exportsService = {
  async list(params?: VoucherListParams): Promise<Export[]> {
    return apiClient.get<Export[]>(appendVoucherDateQuery(ENDPOINT, params));
  },

  async getById(id: string): Promise<Export> {
    return apiClient.get<Export>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateExportDto): Promise<Export> {
    return apiClient.post<Export>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateExportDto): Promise<Export> {
    return apiClient.put<Export>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Export> {
    return apiClient.post<Export>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Export> {
    return apiClient.post<Export>(`${ENDPOINT}/${id}/submit`);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
