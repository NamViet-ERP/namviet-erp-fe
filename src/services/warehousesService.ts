import type { Warehouse } from '../types';
import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';

export type CreateWarehouseDto = Omit<Warehouse, 'id'>;
export type UpdateWarehouseDto = Partial<CreateWarehouseDto>;

const ENDPOINT = '/api/warehouses';

export const warehousesService = {
  async list(): Promise<Warehouse[]> {
    return resolveMock(
      () => import('../mocks/services/warehousesService.mock').then((m) => m.listWarehousesMock()),
      () => apiClient.get<Warehouse[]>(ENDPOINT),
    );
  },
  async getById(id: string): Promise<Warehouse> {
    return resolveMock(
      () => import('../mocks/services/warehousesService.mock').then((m) => m.getWarehouseMock(id)),
      () => apiClient.get<Warehouse>(`${ENDPOINT}/${id}`),
    );
  },
  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    return resolveMock(
      () => import('../mocks/services/warehousesService.mock').then((m) => m.createWarehouseMock(dto)),
      () => apiClient.post<Warehouse>(ENDPOINT, dto),
    );
  },
  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    return resolveMock(
      () => import('../mocks/services/warehousesService.mock').then((m) => m.updateWarehouseMock(id, dto)),
      () => apiClient.put<Warehouse>(`${ENDPOINT}/${id}`, dto),
    );
  },
  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/warehousesService.mock').then((m) => m.removeWarehouseMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
};
