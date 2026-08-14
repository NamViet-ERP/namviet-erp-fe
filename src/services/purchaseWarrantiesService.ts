import { apiClient } from '../lib/apiClient';
import type {
  CreatePurchaseWarrantyClaimRequest,
  ClosePurchaseWarrantyClaimRequest,
  PurchaseWarrantyApiDto,
  PurchaseWarrantyClaimApiDto,
  PurchaseWarrantyClaimListApiDto,
  PurchaseWarrantyDetailApiDto,
  UpdatePurchaseWarrantyRequest,
} from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/warranties';

export type {
  PurchaseWarrantyApiDto,
  PurchaseWarrantyClaimApiDto,
  PurchaseWarrantyClaimListApiDto,
  PurchaseWarrantyDetailApiDto,
  UpdatePurchaseWarrantyRequest,
  CreatePurchaseWarrantyClaimRequest,
  ClosePurchaseWarrantyClaimRequest,
};

export type PurchaseWarrantyListParams = {
  projectCode?: string;
  materialCode?: string;
  supplierId?: number;
  status?: string;
  search?: string;
};

export type PurchaseWarrantyClaimListParams = {
  kind?: 'warranty' | 'complaint';
  status?: string;
  search?: string;
};

export const purchaseWarrantiesService = {
  list(params: PurchaseWarrantyListParams = {}) {
    return apiClient.get<PurchaseWarrantyApiDto[]>(ENDPOINT, {
      projectCode: params.projectCode || undefined,
      materialCode: params.materialCode || undefined,
      supplierId: params.supplierId,
      status: params.status || undefined,
      search: params.search || undefined,
    });
  },

  listClaims(params: PurchaseWarrantyClaimListParams = {}) {
    return apiClient.get<PurchaseWarrantyClaimListApiDto[]>(`${ENDPOINT}/claims`, {
      kind: params.kind || undefined,
      status: params.status || undefined,
      search: params.search || undefined,
    });
  },

  getById(id: string) {
    return apiClient.get<PurchaseWarrantyDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`);
  },

  update(id: string, body: UpdatePurchaseWarrantyRequest) {
    return apiClient.put<PurchaseWarrantyDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`, body);
  },

  createClaim(id: string, body: CreatePurchaseWarrantyClaimRequest) {
    return apiClient.post<PurchaseWarrantyClaimApiDto>(
      `${ENDPOINT}/${encodeURIComponent(id)}/claims`,
      body,
    );
  },

  closeClaim(claimId: string, body: ClosePurchaseWarrantyClaimRequest) {
    return apiClient.post<PurchaseWarrantyClaimApiDto>(
      `${ENDPOINT}/claims/${encodeURIComponent(claimId)}/close`,
      body,
    );
  },

  syncFromReceipts() {
    return apiClient.post<{ created: number; updated: number }>(`${ENDPOINT}/sync-from-receipts`);
  },
};
