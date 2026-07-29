import { apiClient } from '../lib/apiClient';
import type { PagedApiResult, SupplierApiDto, UpsertSupplierRequest } from '../types/wms';

export type { SupplierApiDto } from '../types/wms';
/** @deprecated Prefer UpsertSupplierRequest from types/wms */
export type UpsertSupplierBody = UpsertSupplierRequest;

const ENDPOINT = '/api/warehouse/suppliers';

export function findSupplierByName(suppliers: SupplierApiDto[], name: string) {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return suppliers.find(
    (s) => s.supplierName.localeCompare(trimmed, 'vi', { sensitivity: 'accent' }) === 0,
  );
}

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  rating?: string;
}

export const suppliersService = {
  async list(params: SupplierListParams = {}) {
    const { page = 1, pageSize = 20, search, rating } = params;
    return apiClient.get<PagedApiResult<SupplierApiDto>>(ENDPOINT, {
      page,
      pageSize,
      search: search || undefined,
      rating: rating || undefined,
    });
  },

  async create(body: UpsertSupplierRequest) {
    await apiClient.post(ENDPOINT, {
      supplierCode: body.supplierCode,
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      paymentTerms: body.paymentTerms ?? null,
      rating: body.rating ?? 'A',
    });
    const page = await suppliersService.list({ pageSize: 200 });
    const found = page.items.find((s) => s.supplierCode === body.supplierCode);
    if (!found) throw new Error('Không thể tải NCC vừa tạo');
    return found;
  },

  async update(id: number, body: UpsertSupplierRequest) {
    await apiClient.put(`${ENDPOINT}/${id}`, {
      supplierCode: body.supplierCode,
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      paymentTerms: body.paymentTerms ?? null,
      rating: body.rating ?? 'A',
    });
    return apiClient.get<SupplierApiDto>(`${ENDPOINT}/${id}`);
  },

  async remove(id: number) {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
