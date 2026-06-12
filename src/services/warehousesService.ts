import type { Warehouse } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { warehouses as mockWarehouses } from '../data/warehouses';

export type CreateWarehouseDto = Omit<Warehouse, 'id'>;
export type UpdateWarehouseDto = Partial<CreateWarehouseDto>;

const ENDPOINT = '/api/warehouses';
let store: Warehouse[] = [...mockWarehouses];

export const warehousesService = {
  async list(): Promise<Warehouse[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Warehouse[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Warehouse> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy kho ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Warehouse>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    if (USE_MOCK) {
      const created: Warehouse = { ...dto, id: mockId('wh') };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Warehouse>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy kho ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Warehouse>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      store = store.filter((x) => x.id !== id);
      await mockDelay(null);
      return;
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
