import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';
import type { PagedApiResult } from '../types/wms';

export interface SupplierApiDto {
  id: number;
  supplierCode: string;
  supplierName: string;
  contactPhone: string | null;
  maxDebtDays: number;
  rating: string;
}

export interface UpsertSupplierBody {
  supplierCode: string;
  supplierName: string;
  contactPhone?: string | null;
  maxDebtDays?: number;
  rating?: string;
}

const ENDPOINT = '/api/warehouse/suppliers';
const MOCK = () => import('../mocks/services/suppliersService.mock');

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
    return resolveMock(
      () => MOCK().then((m) => m.listSuppliersMock(params)),
      async () => {
        const { page = 1, pageSize = 20, search, rating } = params;
        return apiClient.get<PagedApiResult<SupplierApiDto>>(ENDPOINT, {
          page,
          pageSize,
          search: search || undefined,
          rating: rating || undefined,
        });
      },
    );
  },

  async create(body: UpsertSupplierBody) {
    return resolveMock(
      () => MOCK().then((m) => m.createSupplierMock(body)),
      async () => {
        await apiClient.post(ENDPOINT, {
          supplierCode: body.supplierCode,
          supplierName: body.supplierName,
          contactPhone: body.contactPhone ?? null,
          maxDebtDays: body.maxDebtDays ?? 30,
          rating: body.rating ?? 'A',
        });
        const page = await suppliersService.list({ pageSize: 200 });
        const found = page.items.find((s) => s.supplierCode === body.supplierCode);
        if (!found) throw new Error('Không thể tải NCC vừa tạo');
        return found;
      },
    );
  },

  async update(id: number, body: UpsertSupplierBody) {
    return resolveMock(
      () => MOCK().then((m) => m.updateSupplierMock(id, body)),
      async () => {
        await apiClient.put(`${ENDPOINT}/${id}`, {
          supplierCode: body.supplierCode,
          supplierName: body.supplierName,
          contactPhone: body.contactPhone ?? null,
          maxDebtDays: body.maxDebtDays ?? 30,
          rating: body.rating ?? 'A',
        });
        return apiClient.get<SupplierApiDto>(`${ENDPOINT}/${id}`);
      },
    );
  },

  async remove(id: number) {
    return resolveMock(
      () => MOCK().then((m) => m.removeSupplierMock(id)),
      async () => { await apiClient.delete(`${ENDPOINT}/${id}`); },
    );
  },
};
