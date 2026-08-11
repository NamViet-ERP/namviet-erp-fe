import { apiClient, saveBlob } from '../lib/apiClient';
import type {
  CreatePurchaseContractRequest,
  ImportPurchaseContractsFromPoResult,
  PurchaseContractApiDto,
  PurchaseContractPagedApiDto,
  UpdatePurchaseContractRequest,
} from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/contracts';

export type PurchaseContractListParams = {
  page?: number;
  pageSize?: number;
  projectCode?: string;
  supplierId?: number;
  poCode?: string;
  status?: string;
  search?: string;
};

export const purchaseContractsService = {
  list(params: PurchaseContractListParams = {}) {
    return apiClient.get<PurchaseContractPagedApiDto>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      projectCode: params.projectCode || undefined,
      supplierId: params.supplierId,
      poCode: params.poCode || undefined,
      status: params.status || undefined,
      search: params.search || undefined,
    });
  },

  getById(id: string) {
    return apiClient.get<PurchaseContractApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`);
  },

  create(body: CreatePurchaseContractRequest) {
    return apiClient.post<PurchaseContractApiDto>(ENDPOINT, body);
  },

  update(id: string, body: UpdatePurchaseContractRequest) {
    return apiClient.put<PurchaseContractApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`, body);
  },

  upload(id: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiClient.postForm<PurchaseContractApiDto>(
      `${ENDPOINT}/${encodeURIComponent(id)}/upload`,
      form,
    );
  },

  async download(id: string, fileName: string) {
    const blob = await apiClient.getBlob(`${ENDPOINT}/${encodeURIComponent(id)}/download`);
    saveBlob(blob, fileName);
  },

  remove(id: string) {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  },

  importFromPoAttachments() {
    return apiClient.post<ImportPurchaseContractsFromPoResult>(
      `${ENDPOINT}/import-from-po-attachments`,
    );
  },
};
