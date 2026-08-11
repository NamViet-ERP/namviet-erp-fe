import { apiClient } from '../lib/apiClient';
import type {
  ConvertPurchaseEstimateResult,
  CreatePurchaseEstimateRequest,
  DecidePurchaseEstimateApprovalRequest,
  PublicPurchaseEstimateApiDto,
  PurchaseEstimateDetailApiDto,
  PurchaseEstimatePagedApiDto,
  PurchaseEstimateShareLinkApiDto,
  SubmitPublicPurchaseEstimateRequest,
  UpdatePurchaseEstimateRequest,
} from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/estimates';
const PUBLIC = '/api/public/purchase-estimates';

export type PurchaseEstimateListParams = {
  page?: number;
  pageSize?: number;
  projectCode?: string;
  search?: string;
};

export const purchaseEstimatesService = {
  list(params: PurchaseEstimateListParams = {}) {
    return apiClient.get<PurchaseEstimatePagedApiDto>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      projectCode: params.projectCode || undefined,
      search: params.search || undefined,
    });
  },

  getById(id: string, version?: number) {
    return apiClient.get<PurchaseEstimateDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`, {
      version,
    });
  },

  create(body: CreatePurchaseEstimateRequest) {
    return apiClient.post<PurchaseEstimateDetailApiDto>(ENDPOINT, body);
  },

  update(id: string, body: UpdatePurchaseEstimateRequest) {
    return apiClient.put<PurchaseEstimateDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}`, body);
  },

  shareLink(id: string) {
    return apiClient.post<PurchaseEstimateShareLinkApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}/share-link`);
  },

  review(id: string) {
    return apiClient.post<PurchaseEstimateDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}/review`);
  },

  submitApproval(id: string) {
    return apiClient.post<PurchaseEstimateDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}/submit-approval`);
  },

  decide(id: string, body: DecidePurchaseEstimateApprovalRequest) {
    return apiClient.post<PurchaseEstimateDetailApiDto>(`${ENDPOINT}/${encodeURIComponent(id)}/decide`, body);
  },

  convertPlan(id: string) {
    return apiClient.post<ConvertPurchaseEstimateResult>(`${ENDPOINT}/${encodeURIComponent(id)}/convert-plan`);
  },

  getPublic(token: string) {
    return apiClient.get<PublicPurchaseEstimateApiDto>(`${PUBLIC}/${encodeURIComponent(token)}`);
  },

  submitPublic(token: string, body: SubmitPublicPurchaseEstimateRequest) {
    return apiClient.post<PublicPurchaseEstimateApiDto>(`${PUBLIC}/${encodeURIComponent(token)}/submit`, body);
  },
};
