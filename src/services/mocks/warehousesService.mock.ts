import type { Warehouse } from '../../types';
import { mockDelay, mockId } from '../../lib/mock';
import { warehouses as seed } from '../../data/warehouses';
import type { CreateWarehouseDto, UpdateWarehouseDto } from '../warehousesService';

let store: Warehouse[] = [...seed];

export async function listWarehousesMock(): Promise<Warehouse[]> {
  return mockDelay(store);
}

export async function getWarehouseMock(id: string): Promise<Warehouse> {
  const found = store.find((x) => x.id === id);
  if (!found) throw new Error(`Không tìm thấy kho ${id}`);
  return mockDelay(found);
}

export async function createWarehouseMock(dto: CreateWarehouseDto): Promise<Warehouse> {
  const created: Warehouse = { ...dto, id: mockId('wh') };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateWarehouseMock(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
  store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find((x) => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy kho ${id}`);
  return mockDelay(updated);
}

export async function removeWarehouseMock(id: string): Promise<void> {
  store = store.filter((x) => x.id !== id);
  await mockDelay(null);
}
