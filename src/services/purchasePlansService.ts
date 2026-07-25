import { apiClient } from '../lib/apiClient';
import type {
  CreatePurchasePlanRequest,
  PurchasePlanDetailApiDto,
  PurchasePlanImportConfirmRequest,
  PurchasePlanImportPreviewApiDto,
  PurchasePlanPagedApiDto,
  UpdatePurchasePlanRequest,
} from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/plans';

export interface PurchasePlanListParams {
  page?: number;
  pageSize?: number;
  code?: string;
  search?: string;
  projectCode?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const purchasePlansService = {
  async list(params: PurchasePlanListParams = {}): Promise<PurchasePlanPagedApiDto> {
    return apiClient.get<PurchasePlanPagedApiDto>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      code: params.code,
      search: params.search,
      projectCode: params.projectCode,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
  },

  async getByCode(code: string): Promise<PurchasePlanDetailApiDto> {
    return apiClient.get<PurchasePlanDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async create(body: CreatePurchasePlanRequest): Promise<PurchasePlanDetailApiDto> {
    return apiClient.post<PurchasePlanDetailApiDto>(ENDPOINT, body);
  },

  async update(code: string, body: UpdatePurchasePlanRequest): Promise<PurchasePlanDetailApiDto> {
    return apiClient.put<PurchasePlanDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`, body);
  },

  async delete(code: string): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async downloadImportTemplate(): Promise<Blob> {
    return apiClient.getBlob(`${ENDPOINT}/import/template`);
  },

  async importPreview(projectCode: string, file: File): Promise<PurchasePlanImportPreviewApiDto> {
    const form = new FormData();
    form.append('projectCode', projectCode);
    form.append('file', file);
    return apiClient.postForm<PurchasePlanImportPreviewApiDto>(`${ENDPOINT}/import/preview`, form);
  },

  async importConfirm(body: PurchasePlanImportConfirmRequest): Promise<PurchasePlanDetailApiDto> {
    return apiClient.post<PurchasePlanDetailApiDto>(`${ENDPOINT}/import/confirm`, body);
  },
};
