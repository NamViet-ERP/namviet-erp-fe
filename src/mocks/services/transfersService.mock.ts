import type { Transfer } from '../../types';
import { mockDelay, mockId } from '../index';
import { MOCK_TRANSFERS, projectNameByCode } from '../data/wmsMockSeed';
import { isVoucherInDateRange, type VoucherListParams } from '../../lib/wms/voucherDateUtils';

let store: Transfer[] = [...MOCK_TRANSFERS];

function nextVoucherCode(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

export async function listTransfersMock(params?: VoucherListParams): Promise<Transfer[]> {
  const filtered = store.filter(t => isVoucherInDateRange(t, params?.dateFrom, params?.dateTo));
  return mockDelay(filtered);
}

export async function getTransferMock(id: string): Promise<Transfer> {
  const found = store.find(x => x.id === id);
  if (!found) throw new Error(`Không tìm thấy phiếu chuyển ${id}`);
  return mockDelay(found);
}

export async function createTransferMock(dto: Omit<Transfer, 'id'>): Promise<Transfer> {
  const fromName = projectNameByCode(dto.project);
  const toName = dto.toProject ? projectNameByCode(dto.toProject) : 'Kho tổng';
  const created: Transfer = {
    ...dto,
    id: mockId('tf'),
    voucherCode: dto.voucherCode?.trim() || nextVoucherCode('CK', 260210 + store.length),
    fromWarehouseName: fromName,
    projectName: fromName,
    toWarehouseName: toName,
    toProjectName: dto.toProject ? toName : undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateTransferMock(id: string, dto: Partial<Transfer>): Promise<Transfer> {
  store = store.map(x => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find(x => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy phiếu chuyển ${id}`);
  return mockDelay(updated);
}

export async function removeTransferMock(id: string): Promise<void> {
  store = store.filter(x => x.id !== id);
  await mockDelay(null);
}
