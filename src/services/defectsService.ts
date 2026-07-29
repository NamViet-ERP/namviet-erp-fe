import { apiClient, saveBlob } from '../lib/apiClient';
import type {
  CreateDefectFromPoRequest,
  CreateDefectFromStockRequest,
  PoDefectEligiblePurchaseOrderApiDto,
  PoDefectPreviewApiDto,
  PurchaseDefectApiDto,
  PurchaseDefectAttachmentApiDto,
  StockDefectPreviewApiDto,
  UpdateDefectProcessingRequest,
} from '../types/api/poDefectApi';

const ENDPOINT = '/api/defects';

export const defectsService = {
  list(): Promise<PurchaseDefectApiDto[]> {
    return apiClient.get<PurchaseDefectApiDto[]>(ENDPOINT);
  },

  getById(id: string): Promise<PurchaseDefectApiDto> {
    return apiClient.get<PurchaseDefectApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`);
  },

  listEligiblePurchaseOrders(): Promise<PoDefectEligiblePurchaseOrderApiDto[]> {
    return apiClient.get<PoDefectEligiblePurchaseOrderApiDto[]>(`${ENDPOINT}/eligible-purchase-orders`);
  },

  previewFromPo(poCode: string): Promise<PoDefectPreviewApiDto> {
    return apiClient.get<PoDefectPreviewApiDto>(
      `${ENDPOINT}/from-po/${encodeURIComponent(poCode)}/preview`,
    );
  },

  createFromPo(poCode: string, request: CreateDefectFromPoRequest): Promise<PurchaseDefectApiDto> {
    return apiClient.post<PurchaseDefectApiDto>(
      `${ENDPOINT}/from-po/${encodeURIComponent(poCode)}`,
      request,
    );
  },

  previewFromStock(projectCode: string): Promise<StockDefectPreviewApiDto> {
    return apiClient.get<StockDefectPreviewApiDto>(
      `${ENDPOINT}/from-stock/${encodeURIComponent(projectCode)}/preview`,
    );
  },

  createFromStock(request: CreateDefectFromStockRequest): Promise<PurchaseDefectApiDto> {
    return apiClient.post<PurchaseDefectApiDto>(`${ENDPOINT}/from-stock`, request);
  },

  submit(id: string): Promise<PurchaseDefectApiDto> {
    return apiClient.post<PurchaseDefectApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}/submit`);
  },

  approve(id: string): Promise<PurchaseDefectApiDto> {
    return apiClient.post<PurchaseDefectApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}/approve`);
  },

  updateReason(id: string, reason: string): Promise<PurchaseDefectApiDto> {
    return apiClient.put<PurchaseDefectApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}/reason`, {
      reason,
    });
  },

  updateProcessing(id: string, request: UpdateDefectProcessingRequest): Promise<PurchaseDefectApiDto> {
    return apiClient.put<PurchaseDefectApiDto>(
      `${ENDPOINT}/${encodeURIComponent(id)}/processing`,
      request,
    );
  },

  async uploadAttachment(
    id: string,
    file: File,
    kind: 'photo' | 'document' = 'photo',
  ): Promise<PurchaseDefectAttachmentApiDto> {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    return apiClient.postForm<PurchaseDefectAttachmentApiDto>(
      `${ENDPOINT}/${encodeURIComponent(id)}/attachments`,
      form,
    );
  },

  async downloadAttachment(id: string, attachmentId: string, fileName: string): Promise<void> {
    const blob = await apiClient.getBlob(
      `${ENDPOINT}/${encodeURIComponent(id)}/attachments/${attachmentId}`,
    );
    saveBlob(blob, fileName);
  },

  getAttachmentBlob(id: string, attachmentId: string): Promise<Blob> {
    return apiClient.getBlob(
      `${ENDPOINT}/${encodeURIComponent(id)}/attachments/${attachmentId}`,
    );
  },

  deleteAttachment(id: string, attachmentId: string): Promise<void> {
    return apiClient.delete(
      `${ENDPOINT}/${encodeURIComponent(id)}/attachments/${attachmentId}`,
    );
  },

  remove(id: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  },
};
