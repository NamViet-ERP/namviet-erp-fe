import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay } from '../lib/mock';
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

const MOCK_SUPPLIERS: SupplierApiDto[] = [
  { id: 1, supplierCode: 'NCC-001', supplierName: 'Công ty TNHH Thép Việt Nam', contactPhone: '0901234567', maxDebtDays: 30, rating: 'A' },
  { id: 2, supplierCode: 'NCC-002', supplierName: 'Hòa Phát Group', contactPhone: '0912345678', maxDebtDays: 45, rating: 'A' },
  { id: 3, supplierCode: 'NCC-003', supplierName: 'Siemens Vietnam', contactPhone: null, maxDebtDays: 60, rating: 'B' },
];

let mockStore: SupplierApiDto[] = [...MOCK_SUPPLIERS];
let nextMockId = 4;

function mockList(params: SupplierListParams): PagedApiResult<SupplierApiDto> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  let filtered = [...mockStore];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      s => s.supplierName.toLowerCase().includes(q) || s.supplierCode.toLowerCase().includes(q),
    );
  }
  if (params.rating) {
    filtered = filtered.filter(s => s.rating === params.rating);
  }
  const totalCount = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export function findSupplierByName(suppliers: SupplierApiDto[], name: string) {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return suppliers.find(
    s => s.supplierName.localeCompare(trimmed, 'vi', { sensitivity: 'accent' }) === 0,
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
    if (USE_MOCK) return mockDelay(mockList(params));
    const { page = 1, pageSize = 20, search, rating } = params;
    return apiClient.get<PagedApiResult<SupplierApiDto>>(ENDPOINT, {
      page,
      pageSize,
      search: search || undefined,
      rating: rating || undefined,
    });
  },

  async create(body: UpsertSupplierBody) {
    if (USE_MOCK) {
      const created: SupplierApiDto = {
        id: nextMockId++,
        supplierCode: body.supplierCode,
        supplierName: body.supplierName,
        contactPhone: body.contactPhone ?? null,
        maxDebtDays: body.maxDebtDays ?? 30,
        rating: body.rating ?? 'A',
      };
      mockStore = [created, ...mockStore];
      return mockDelay(created);
    }
    await apiClient.post(ENDPOINT, {
      supplierCode: body.supplierCode,
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      rating: body.rating ?? 'A',
    });
    const page = await suppliersService.list({ pageSize: 200 });
    const found = page.items.find(s => s.supplierCode === body.supplierCode);
    if (!found) throw new Error('Không thể tải NCC vừa tạo');
    return found;
  },

  async update(id: number, body: UpsertSupplierBody) {
    if (USE_MOCK) {
      mockStore = mockStore.map(s =>
        s.id === id
          ? {
              ...s,
              supplierCode: body.supplierCode,
              supplierName: body.supplierName,
              contactPhone: body.contactPhone ?? null,
              maxDebtDays: body.maxDebtDays ?? 30,
              rating: body.rating ?? 'A',
            }
          : s,
      );
      const updated = mockStore.find(s => s.id === id);
      if (!updated) throw new Error(`Không tìm thấy NCC #${id}`);
      return mockDelay(updated);
    }
    await apiClient.put(`${ENDPOINT}/${id}`, {
      supplierCode: body.supplierCode,
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      rating: body.rating ?? 'A',
    });
    return apiClient.get<SupplierApiDto>(`${ENDPOINT}/${id}`);
  },

  async remove(id: number) {
    if (USE_MOCK) {
      mockStore = mockStore.filter(s => s.id !== id);
      await mockDelay(null);
      return;
    }
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
