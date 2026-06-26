import type { Stocktake } from '../../types';
import { mockDelay, mockId } from '../index';
import { stocktakes as seed } from '../data/stocktakes';
import type { CreateStocktakeDto, UpdateStocktakeDto } from '../../services/stocktakesService';

let store: Stocktake[] = [...seed];

export async function listStocktakesMock(): Promise<Stocktake[]> {
  return mockDelay(store);
}

export async function getStocktakeMock(id: string): Promise<Stocktake> {
  const found = store.find((x) => x.id === id);
  if (!found) throw new Error(`Không tìm thấy phiếu kiểm kê ${id}`);
  return mockDelay(found);
}

export async function createStocktakeMock(dto: CreateStocktakeDto): Promise<Stocktake> {
  const created: Stocktake = { ...dto, id: mockId('st') };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateStocktakeMock(id: string, dto: UpdateStocktakeDto): Promise<Stocktake> {
  store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find((x) => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy phiếu kiểm kê ${id}`);
  return mockDelay(updated);
}

export async function approveStocktakeMock(id: string): Promise<Stocktake> {
  store = store.map((x) =>
    x.id === id
      ? { ...x, status: 'approved', condition: 'completed', isFrozen: false }
      : x,
  );
  const updated = store.find((x) => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy phiếu kiểm kê ${id}`);
  return mockDelay(updated);
}

export async function removeStocktakeMock(id: string): Promise<void> {
  store = store.filter((x) => x.id !== id);
  await mockDelay(null);
}
