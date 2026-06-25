import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import type { MaterialUnitApiDto } from '../types/wms';

export interface UpsertMaterialUnitRequest {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

const ENDPOINT = '/api/material-units';

export const materialUnitsService = {
  async list(activeOnly = false): Promise<MaterialUnitApiDto[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialUnitsService.mock');
      return mock.listMaterialUnitsMock(activeOnly);
    }
    const qs = activeOnly ? '?activeOnly=true' : '';
    return apiClient.get<MaterialUnitApiDto[]>(`${ENDPOINT}${qs}`);
  },

  async create(body: UpsertMaterialUnitRequest): Promise<MaterialUnitApiDto> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialUnitsService.mock');
      return mock.createMaterialUnitMock(body);
    }
    return apiClient.post<MaterialUnitApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialUnitRequest): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialUnitsService.mock');
      return mock.updateMaterialUnitMock(id, body);
    }
    await apiClient.put(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialUnitsService.mock');
      return mock.removeMaterialUnitMock(id);
    }
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
