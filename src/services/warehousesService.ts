import type { Warehouse } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';

export type CreateWarehouseDto = Omit<Warehouse, 'id'>;
export type UpdateWarehouseDto = Partial<CreateWarehouseDto>;

const ENDPOINT = '/api/warehouses';

export const warehousesService = {
  async list(): Promise<Warehouse[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/warehousesService.mock');
      return mock.listWarehousesMock();
    }
    return apiClient.get<Warehouse[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Warehouse> {
    if (USE_MOCK) {
      const mock = await import('./mocks/warehousesService.mock');
      return mock.getWarehouseMock(id);
    }
    return apiClient.get<Warehouse>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    if (USE_MOCK) {
      const mock = await import('./mocks/warehousesService.mock');
      return mock.createWarehouseMock(dto);
    }
    return apiClient.post<Warehouse>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    if (USE_MOCK) {
      const mock = await import('./mocks/warehousesService.mock');
      return mock.updateWarehouseMock(id, dto);
    }
    return apiClient.put<Warehouse>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/warehousesService.mock');
      return mock.removeWarehouseMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
