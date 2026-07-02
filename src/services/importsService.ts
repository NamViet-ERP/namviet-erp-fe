import type { Import } from '../types';
import { apiClient } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';

export type CreateImportDto = Omit<Import, 'id'>;
export type UpdateImportDto = Partial<CreateImportDto>;

const ENDPOINT = '/api/imports';

export const importsService = {
  async list(params?: VoucherListParams): Promise<Import[]> {
    return apiClient.get<Import[]>(appendVoucherDateQuery(ENDPOINT, params));
  },

  async getById(id: string): Promise<Import> {
    return apiClient.get<Import>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateImportDto): Promise<Import> {
    return apiClient.post<Import>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateImportDto): Promise<Import> {
    return apiClient.put<Import>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Import> {
    return apiClient.post<Import>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Import> {
    return apiClient.post<Import>(`${ENDPOINT}/${id}/submit`);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
