import { apiClient, saveBlob } from '../lib/apiClient';
import type {
  CreateServiceExpenseItemRequest,
  ServiceExpenseImportBatchRequest,
  ServiceExpenseImportParseResultDto,
  ServiceExpenseImportResultDto,
  ServiceExpenseItemApiDto,
  ServiceExpenseItemPagedResponse,
  ServiceExpenseItemQueryParams,
  UpdateServiceExpenseItemRequest,
} from '../types/api/serviceExpenseItem';

const ENDPOINT = '/api/purchasing/service-items';

export const serviceExpenseItemsService = {
  async list(params: ServiceExpenseItemQueryParams = {}): Promise<ServiceExpenseItemPagedResponse> {
    return apiClient.get<ServiceExpenseItemPagedResponse>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search?.trim() || undefined,
      type: params.type || undefined,
      isActive: params.isActive,
      all: params.all,
    });
  },

  async getById(id: number): Promise<ServiceExpenseItemApiDto> {
    return apiClient.get<ServiceExpenseItemApiDto>(`${ENDPOINT}/${id}`);
  },

  async create(data: CreateServiceExpenseItemRequest): Promise<ServiceExpenseItemApiDto> {
    return apiClient.post<ServiceExpenseItemApiDto>(ENDPOINT, data);
  },

  async update(id: number, data: UpdateServiceExpenseItemRequest): Promise<ServiceExpenseItemApiDto> {
    return apiClient.put<ServiceExpenseItemApiDto>(`${ENDPOINT}/${id}`, data);
  },

  async toggleActive(id: number): Promise<ServiceExpenseItemApiDto> {
    return apiClient.patch<ServiceExpenseItemApiDto>(`${ENDPOINT}/${id}/toggle-active`);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },

  async downloadImportTemplate(): Promise<boolean> {
    const blob = await apiClient.getBlob(`${ENDPOINT}/import-template`);
    return await saveBlob(blob, 'mau-import-dich-vu-chi-phi.xlsx');
  },

  async parseImportFile(file: File): Promise<ServiceExpenseImportParseResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<ServiceExpenseImportParseResultDto>(`${ENDPOINT}/parse-import-file`, formData);
  },

  async importBatch(request: ServiceExpenseImportBatchRequest): Promise<ServiceExpenseImportResultDto> {
    return apiClient.post<ServiceExpenseImportResultDto>(`${ENDPOINT}/import-batch`, request);
  },
};
