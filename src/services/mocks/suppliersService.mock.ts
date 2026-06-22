import { mockDelay } from '../../lib/mock';
import type { PagedApiResult } from '../../types/wms';
import type { SupplierApiDto, SupplierListParams, UpsertSupplierBody } from '../suppliersService';

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

export async function listSuppliersMock(
  params: SupplierListParams = {},
): Promise<PagedApiResult<SupplierApiDto>> {
  return mockDelay(mockList(params));
}

export async function createSupplierMock(body: UpsertSupplierBody): Promise<SupplierApiDto> {
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

export async function updateSupplierMock(id: number, body: UpsertSupplierBody): Promise<SupplierApiDto> {
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

export async function removeSupplierMock(id: number): Promise<void> {
  mockStore = mockStore.filter(s => s.id !== id);
  await mockDelay(null);
}
