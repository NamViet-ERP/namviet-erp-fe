import { apiClient } from '../lib/apiClient';
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrderDetailApiDto,
  PurchaseOrderPagedApiDto,
  UpdatePurchaseOrderRequest,
} from '../types/api/purchasingApi';

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
};
