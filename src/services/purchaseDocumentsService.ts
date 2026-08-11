import { apiClient, saveBlob } from '../lib/apiClient';
import { purchaseOrdersService } from './purchaseOrdersService';
import type { PurchaseDocumentPagedApiDto } from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/documents';

export type PurchaseDocumentListParams = {
  page?: number;
  pageSize?: number;
  poCode?: string;
  projectCode?: string;
  supplierId?: number;
  docType?: string;
  search?: string;
};

export const purchaseDocumentsService = {
  list(params: PurchaseDocumentListParams = {}) {
    return apiClient.get<PurchaseDocumentPagedApiDto>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      poCode: params.poCode || undefined,
      projectCode: params.projectCode || undefined,
      supplierId: params.supplierId,
      docType: params.docType || undefined,
      search: params.search || undefined,
    });
  },

  async download(poCode: string, id: string, fileName: string) {
    const blob = await purchaseOrdersService.downloadAttachment(poCode, id);
    saveBlob(blob, fileName);
  },
};
