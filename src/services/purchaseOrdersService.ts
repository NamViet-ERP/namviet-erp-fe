import { apiClient } from '../lib/apiClient';
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrderDetailApiDto,
  PurchaseOrderInstallmentApiDto,
  PurchaseOrderInstallmentDocumentApiDto,
  PurchaseOrderCommentApiDto,
  PurchaseOrderPagedApiDto,
  UpdatePurchaseOrderRequest,
} from '../types/api/purchasingApi';
import type {
  PurchaseOrderAttachmentApiDto,
  PurchaseOrderDocType,
} from '../types/api/purchaseOrderAttachmentApi';

const ENDPOINT = '/api/purchasing/orders';

export interface PurchaseOrderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  supplierId?: number;
  planCode?: string;
  projectCode?: string;
  orderPlacementStatus?: string;
  deliveryStatus?: string;
  paymentStatus?: string;
  /** true = chỉ đơn có cảnh báo thanh toán */
  paymentWarning?: boolean;
}

export const purchaseOrdersService = {
  async list(params: PurchaseOrderListParams = {}): Promise<PurchaseOrderPagedApiDto> {
    return apiClient.get<PurchaseOrderPagedApiDto>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      supplierId: params.supplierId,
      planCode: params.planCode,
      projectCode: params.projectCode,
      orderPlacementStatus: params.orderPlacementStatus,
      deliveryStatus: params.deliveryStatus,
      paymentStatus: params.paymentStatus,
      paymentWarning: params.paymentWarning === undefined ? undefined : String(params.paymentWarning),
    });
  },

  async getByCode(code: string): Promise<PurchaseOrderDetailApiDto> {
    return apiClient.get<PurchaseOrderDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async create(body: CreatePurchaseOrderRequest): Promise<PurchaseOrderDetailApiDto> {
    return apiClient.post<PurchaseOrderDetailApiDto>(ENDPOINT, body);
  },

  async approve(code: string): Promise<PurchaseOrderDetailApiDto> {
    return apiClient.post<PurchaseOrderDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}/approve`);
  },

  async unapprove(code: string): Promise<PurchaseOrderDetailApiDto> {
    return apiClient.post<PurchaseOrderDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}/unapprove`);
  },

  async place(code: string): Promise<PurchaseOrderDetailApiDto> {
    return apiClient.post<PurchaseOrderDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}/place`);
  },

  async update(code: string, body: UpdatePurchaseOrderRequest): Promise<PurchaseOrderDetailApiDto> {
    return apiClient.put<PurchaseOrderDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`, body);
  },

  async listAttachments(code: string): Promise<PurchaseOrderAttachmentApiDto[]> {
    return apiClient.get<PurchaseOrderAttachmentApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/attachments`,
    );
  },

  async uploadAttachment(
    code: string,
    file: File,
    docType: PurchaseOrderDocType = 'other',
  ): Promise<PurchaseOrderAttachmentApiDto> {
    const form = new FormData();
    form.append('file', file);
    form.append('docType', docType);
    return apiClient.postForm<PurchaseOrderAttachmentApiDto>(
      `${ENDPOINT}/${encodeURIComponent(code)}/attachments`,
      form,
    );
  },

  async deleteAttachment(code: string, attachmentId: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}/attachments/${attachmentId}`);
  },

  async downloadAttachment(code: string, attachmentId: string): Promise<Blob> {
    return apiClient.getBlob(
      `${ENDPOINT}/${encodeURIComponent(code)}/attachments/${attachmentId}/download`,
    );
  },

  async listComments(code: string): Promise<PurchaseOrderCommentApiDto[]> {
    return apiClient.get<PurchaseOrderCommentApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/comments`,
    );
  },

  async createComment(code: string, body: string): Promise<PurchaseOrderCommentApiDto> {
    return apiClient.post<PurchaseOrderCommentApiDto>(
      `${ENDPOINT}/${encodeURIComponent(code)}/comments`,
      { body },
    );
  },

  async updateComment(code: string, commentId: string, body: string): Promise<PurchaseOrderCommentApiDto> {
    return apiClient.put<PurchaseOrderCommentApiDto>(
      `${ENDPOINT}/${encodeURIComponent(code)}/comments/${commentId}`,
      { body },
    );
  },

  async deleteComment(code: string, commentId: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}/comments/${commentId}`);
  },

  async listInstallmentDocuments(
    code: string,
    stageNumber: number,
  ): Promise<PurchaseOrderInstallmentDocumentApiDto[]> {
    return apiClient.get<PurchaseOrderInstallmentDocumentApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/installments/${stageNumber}/documents`,
    );
  },

  async uploadInstallmentDocument(
    code: string,
    stageNumber: number,
    file: File,
    docType: string,
  ): Promise<PurchaseOrderInstallmentDocumentApiDto> {
    const form = new FormData();
    form.append('file', file);
    form.append('docType', docType);
    return apiClient.putForm<PurchaseOrderInstallmentDocumentApiDto>(
      `${ENDPOINT}/${encodeURIComponent(code)}/installments/${stageNumber}/documents`,
      form,
    );
  },

  async downloadInstallmentDocument(
    code: string,
    stageNumber: number,
    documentId: number,
  ): Promise<Blob> {
    return apiClient.getBlob(
      `${ENDPOINT}/${encodeURIComponent(code)}/installments/${stageNumber}/documents/${documentId}/download`,
    );
  },

  async deleteInstallmentDocument(
    code: string,
    stageNumber: number,
    documentId: number,
  ): Promise<void> {
    return apiClient.delete(
      `${ENDPOINT}/${encodeURIComponent(code)}/installments/${stageNumber}/documents/${documentId}`,
    );
  },

  async completeInstallment(
    code: string,
    stageNumber: number,
  ): Promise<PurchaseOrderInstallmentApiDto> {
    return apiClient.post<PurchaseOrderInstallmentApiDto>(
      `${ENDPOINT}/${encodeURIComponent(code)}/installments/${stageNumber}/complete`,
    );
  },
};
