import type { Import } from '../types';
import type { ApproveImportRequestApiDto } from '../types/api/importBudgetApi';
import type { ImportParseResultApiDto } from '../types/api/importParseApi';
import type {
  CreateImportFromPoRequest,
  PoImportPreviewApiDto,
} from '../types/api/poImportApi';
import { apiClient, saveBlob } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';

export type CreateImportDto = Omit<Import, 'id' | 'createdBy'> & { createdBy?: string };
export type UpdateImportDto = Partial<CreateImportDto>;
export type ImportAttachmentKind = 'document' | 'photo';

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

  /** SL còn lại trên PO (đã trừ Received + pending NK). excludeTicketCode: bỏ qua phiếu đang sửa. */
  async previewFromPurchaseOrder(
    poCode: string,
    options?: { excludeTicketCode?: string },
  ): Promise<PoImportPreviewApiDto> {
    const params = new URLSearchParams();
    if (options?.excludeTicketCode) {
      params.set('excludeTicketCode', options.excludeTicketCode);
    }
    const qs = params.toString();
    return apiClient.get<PoImportPreviewApiDto>(
      `${ENDPOINT}/from-po/${encodeURIComponent(poCode)}/preview${qs ? `?${qs}` : ''}`,
    );
  },

  /** Tạo phiếu nhập nháp từ PO — chọn dòng + SL (hoặc toàn bộ còn lại nếu body trống). */
  async createFromPurchaseOrder(
    poCode: string,
    request?: CreateImportFromPoRequest | null,
  ): Promise<Import> {
    return apiClient.post<Import>(
      `${ENDPOINT}/from-po/${encodeURIComponent(poCode)}`,
      request ?? {},
    );
  },

  async updateReceiptEvaluation(id: string, evaluation: string): Promise<Import> {
    return apiClient.put<Import>(`${ENDPOINT}/${id}/receipt-evaluation`, { evaluation });
  },

  async uploadAttachment(
    id: string,
    file: File,
    kind: ImportAttachmentKind,
  ): Promise<Import> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    await apiClient.postForm(`${ENDPOINT}/${id}/attachments`, formData);
    return this.getById(id);
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<Import> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}/attachments/${attachmentId}`);
    return this.getById(id);
  },

  async downloadAttachment(id: string, attachmentId: string): Promise<Blob> {
    return apiClient.getBlob(`${ENDPOINT}/${id}/attachments/${attachmentId}/download`);
  },
};
