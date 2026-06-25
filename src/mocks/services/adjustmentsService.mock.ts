import type { Adjustment } from '../../types';
import { mockDelay, mockId } from '../index';
import { adjustments as seed } from '../data/adjustments';
import type { CreateAdjustmentDto, UpdateAdjustmentDto } from '../../services/adjustmentsService';

let store: Adjustment[] = [...seed];

export async function listAdjustmentsMock(): Promise<Adjustment[]> {
  return mockDelay(store);
}

export async function getAdjustmentMock(id: string): Promise<Adjustment> {
  const found = store.find((x) => x.id === id);
  if (!found) throw new Error(`Không tìm thấy phiếu điều chỉnh ${id}`);
  return mockDelay(found);
}

export async function createAdjustmentMock(dto: CreateAdjustmentDto): Promise<Adjustment> {
  const created: Adjustment = { ...dto, id: mockId('adj') };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateAdjustmentMock(id: string, dto: UpdateAdjustmentDto): Promise<Adjustment> {
  store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find((x) => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy phiếu điều chỉnh ${id}`);
  return mockDelay(updated);
}

export async function removeAdjustmentMock(id: string): Promise<void> {
  store = store.filter((x) => x.id !== id);
  await mockDelay(null);
}
