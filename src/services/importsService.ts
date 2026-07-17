import type { Import } from '../types';
import type { ApproveImportRequestApiDto } from '../types/api/importBudgetApi';
import type { ImportParseResultApiDto } from '../types/api/importParseApi';
import { apiClient, saveBlob } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';

export type CreateImportDto = Omit<Import, 'id' | 'createdBy'> & { createdBy?: string };
export type UpdateImportDto = Partial<CreateImportDto>;

const ENDPOINT = '/api/imports';
async function downloadBlob(path: string, fileName: string): Promise<void> {
  saveBlob(await apiClient.getBlob(path), fileName);
}

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

  async approve(id: string, options?: ApproveImportRequestApiDto): Promise<Import> {
    return apiClient.post<Import>(`${ENDPOINT}/${id}/approve`, options ?? {});
  },

  async submit(id: string): Promise<Import> {
    return apiClient.post<Import>(`${ENDPOINT}/${id}/submit`);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },

  async downloadImportTemplate(): Promise<void> {
    await downloadBlob(`${ENDPOINT}/import-template`, 'phieu-nhap-vat-tu-mau.xlsx');
  },

  async parseImportFile(file: File): Promise<ImportParseResultApiDto> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<ImportParseResultApiDto>(`${ENDPOINT}/parse-import-file`, formData);
  },
};
