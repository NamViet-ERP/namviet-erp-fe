import type { Import } from '../../types';
import { mockDelay, mockId } from '../index';
import { MOCK_IMPORTS } from '../data/wmsMockSeed';

let store: Import[] = [...MOCK_IMPORTS];

function nextVoucherCode(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

export async function listImportsMock(): Promise<Import[]> {
  return mockDelay(store);
}

export async function getImportMock(id: string): Promise<Import> {
  const found = store.find((x) => x.id === id);
  if (!found) throw new Error(`Không tìm thấy phiếu nhập ${id}`);
  return mockDelay(found);
}

export async function createImportMock(dto: Omit<Import, 'id'>): Promise<Import> {
  const created: Import = {
    ...dto,
    id: mockId('im'),
    voucherCode: dto.voucherCode?.trim() || nextVoucherCode('NK', 260010 + store.length),
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateImportMock(id: string, dto: Partial<Import>): Promise<Import> {
  store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find((x) => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy phiếu nhập ${id}`);
  return mockDelay(updated);
}

export async function removeImportMock(id: string): Promise<void> {
  store = store.filter((x) => x.id !== id);
  await mockDelay(null);
}
