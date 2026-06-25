import { mockDelay } from '../index';
import { sortViBy } from '../../lib/sortVi';
import type { RecruitmentPosition } from '../../services/positionsService';
import { readStore, writeStore } from './positionsMockStore';

export async function listPositionsMock(): Promise<RecruitmentPosition[]> {
  return mockDelay(sortViBy(readStore(), p => p.name));
}

export async function createPositionMock(name: string): Promise<RecruitmentPosition> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Tên vị trí không được để trống');
  const items = readStore();
  if (items.some(item => item.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Vị trí này đã tồn tại');
  }
  const created: RecruitmentPosition = { name: trimmed, isActive: true };
  items.push(created);
  writeStore(items);
  return mockDelay(created);
}

export async function togglePositionStatusMock(name: string): Promise<RecruitmentPosition> {
  const items = readStore();
  const idx = items.findIndex(item => item.name === name);
  if (idx === -1) throw new Error(`Không tìm thấy vị trí "${name}"`);
  items[idx].isActive = !items[idx].isActive;
  writeStore(items);
  return mockDelay(items[idx]);
}

export async function removePositionMock(name: string): Promise<void> {
  writeStore(readStore().filter(item => item.name !== name));
  await mockDelay(undefined);
}
