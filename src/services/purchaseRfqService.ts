import { apiClient } from '../lib/apiClient';
import type {
  PurchaseRfqAverageApiDto,
  PurchaseRfqQuoteApiDto,
  PurchaseRfqQuotePagedApiDto,
  PurchaseRfqWinRateApiDto,
  UpsertPurchaseRfqQuoteRequest,
} from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/rfq-quotes';

export type PurchaseRfqListParams = {
  page?: number;
  pageSize?: number;
  supplierId?: number;
  status?: string;
  year?: number;
  quarter?: number;
  search?: string;
};

export const purchaseRfqService = {
  list(params: PurchaseRfqListParams = {}) {
    return apiClient.get<PurchaseRfqQuotePagedApiDto>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      supplierId: params.supplierId,
      status: params.status || undefined,
      year: params.year,
      quarter: params.quarter,
      search: params.search || undefined,
    });
  },

  averages(groupBy: 'quarter' | 'year', year?: number) {
    return apiClient.get<PurchaseRfqAverageApiDto[]>(`${ENDPOINT}/averages`, { groupBy, year });
  },

  winRates() {
    return apiClient.get<PurchaseRfqWinRateApiDto[]>(`${ENDPOINT}/win-rates`);
  },

  create(body: UpsertPurchaseRfqQuoteRequest) {
    return apiClient.post<PurchaseRfqQuoteApiDto>(ENDPOINT, body);
  },

  update(id: string, body: UpsertPurchaseRfqQuoteRequest) {
    return apiClient.put<PurchaseRfqQuoteApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`, body);
  },
};
