import type { Export } from '../../types';
import { mockDelay, mockId } from '../index';
import { MOCK_EXPORTS, projectNameByCode } from '../data/wmsMockSeed';

let store: Export[] = [...MOCK_EXPORTS];

function nextVoucherCode(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

export async function listExportsMock(): Promise<Export[]> {
  return mockDelay(store);
}

export async function getExportMock(id: string): Promise<Export> {
  const found = store.find(x => x.id === id);
  if (!found) throw new Error(`Không tìm thấy phiếu xuất ${id}`);
  return mockDelay(found);
}

export async function createExportMock(dto: Omit<Export, 'id'>): Promise<Export> {
  const name = projectNameByCode(dto.project);
  const created: Export = {
    ...dto,
    id: mockId('ex'),
    voucherCode: dto.voucherCode?.trim() || nextVoucherCode('XK', 260110 + store.length),
    projectName: name,
    warehouseName: name,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateExportMock(id: string, dto: Partial<Export>): Promise<Export> {
  store = store.map(x => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find(x => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy phiếu xuất ${id}`);
  return mockDelay(updated);
}

export async function removeExportMock(id: string): Promise<void> {
  store = store.filter(x => x.id !== id);
  await mockDelay(null);
}
