import { apiClient } from '../lib/apiClient';
import type {
  CreatePurchasePaymentRequest,
  PurchasePaymentApiDto,
  PurchasePaymentPagedApiDto,
} from '../types/api/poPaymentApi';

const ENDPOINT = '/api/purchasing/payments';

export interface PurchasePaymentListParams {
  page?: number;
  pageSize?: number;
  poCode?: string;
  status?: string;
  search?: string;
}

export const purchasePaymentsService = {
  async list(params: PurchasePaymentListParams = {}): Promise<PurchasePaymentPagedApiDto> {
    return apiClient.get<PurchasePaymentPagedApiDto>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      poCode: params.poCode,
      status: params.status,
      search: params.search,
    });
  },

  async getByCode(code: string): Promise<PurchasePaymentApiDto> {
    return apiClient.get<PurchasePaymentApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async create(body: CreatePurchasePaymentRequest): Promise<PurchasePaymentApiDto> {
    return apiClient.post<PurchasePaymentApiDto>(ENDPOINT, body);
  },
};
