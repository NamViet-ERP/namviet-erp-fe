import type { Import } from '../types';
import type { ApproveImportRequestApiDto } from '../types/api/importBudgetApi';
import { apiClient } from '../lib/apiClient';
import { getStoredToken } from '../lib/authSession';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';

export type CreateImportDto = Omit<Import, 'id' | 'createdBy'> & { createdBy?: string };
export type UpdateImportDto = Partial<CreateImportDto>;

const ENDPOINT = '/api/imports';
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function downloadBlob(path: string, fileName: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.trim() || `Không thể tải file (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, 500);
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
