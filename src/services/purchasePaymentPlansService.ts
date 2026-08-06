import { apiClient, ApiError } from '../lib/apiClient';
import type {
  PurchasePaymentNextStageApiDto,
  PurchasePaymentPlanPagedApiDto,
} from '../types/api/purchasingApi';

const PLANS_ENDPOINT = '/api/purchasing/payment-plans';
const PAYMENTS_ENDPOINT = '/api/purchasing/payments';

export interface PurchasePaymentPlanListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  projectCode?: string;
}

export const purchasePaymentPlansService = {
  async list(params: PurchasePaymentPlanListParams = {}): Promise<PurchasePaymentPlanPagedApiDto> {
    return apiClient.get<PurchasePaymentPlanPagedApiDto>(PLANS_ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      projectCode: params.projectCode,
    });
  },

  async getNextStage(poCode: string): Promise<PurchasePaymentNextStageApiDto | null> {
    try {
      return await apiClient.get<PurchasePaymentNextStageApiDto>(
        `${PAYMENTS_ENDPOINT}/next-stage`,
        { poCode },
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
};
