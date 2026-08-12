import { apiClient } from '../lib/apiClient';
import type { PagedApiResult, SupplierApiDto, SupplierNextCodeApiDto, UpsertSupplierRequest } from '../types/wms';

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
  groupId?: number;
  isBlacklisted?: boolean;
  approvalStatus?: string;
}

export const suppliersService = {
  async list(params: SupplierListParams = {}) {
    const { page = 1, pageSize = 20, search, rating, groupId, isBlacklisted, approvalStatus } = params;
    return apiClient.get<PagedApiResult<SupplierApiDto>>(ENDPOINT, {
      page,
      pageSize,
      search: search || undefined,
      rating: rating || undefined,
      groupId: groupId ?? undefined,
      isBlacklisted: isBlacklisted ?? undefined,
      approvalStatus: approvalStatus || undefined,
    });
  },

  nextCode() {
    return apiClient.get<SupplierNextCodeApiDto>(`${ENDPOINT}/next-code`);
  },

  create(body: UpsertSupplierRequest) {
    return apiClient.post<SupplierApiDto>(ENDPOINT, {
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      paymentTerms: body.paymentTerms ?? null,
    });
  },

  async update(id: number, body: UpsertSupplierRequest) {
    await apiClient.put(`${ENDPOINT}/${id}`, {
      supplierCode: body.supplierCode,
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      paymentTerms: body.paymentTerms ?? null,
    });
    return apiClient.get<SupplierApiDto>(`${ENDPOINT}/${id}`);
  },

  async remove(id: number) {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },

  async approve(id: number) {
    return apiClient.post<SupplierApiDto>(`${ENDPOINT}/${id}/approve`);
  },

  async reject(id: number) {
    return apiClient.post<SupplierApiDto>(`${ENDPOINT}/${id}/reject`);
  },
};
