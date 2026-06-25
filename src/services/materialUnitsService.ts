import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';
import type { MaterialUnitApiDto } from '../types/wms';

export interface UpsertMaterialUnitRequest {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

const ENDPOINT = '/api/material-units';
const MOCK = () => import('../mocks/services/materialUnitsService.mock');

export const materialUnitsService = {
  async list(activeOnly = false): Promise<MaterialUnitApiDto[]> {
    return resolveMock(
      () => MOCK().then((m) => m.listMaterialUnitsMock(activeOnly)),
      async () => {
        const qs = activeOnly ? '?activeOnly=true' : '';
        return apiClient.get<MaterialUnitApiDto[]>(`${ENDPOINT}${qs}`);
      },
    );
  },

  async create(body: UpsertMaterialUnitRequest): Promise<MaterialUnitApiDto> {
    return resolveMock(
      () => MOCK().then((m) => m.createMaterialUnitMock(body)),
      () => apiClient.post<MaterialUnitApiDto>(ENDPOINT, body),
    );
  },

  async update(id: number, body: UpsertMaterialUnitRequest): Promise<void> {
    return resolveMock(
      () => MOCK().then((m) => m.updateMaterialUnitMock(id, body)),
      async () => { await apiClient.put(`${ENDPOINT}/${id}`, body); },
    );
  },

  async remove(id: number): Promise<void> {
    return resolveMock(
      () => MOCK().then((m) => m.removeMaterialUnitMock(id)),
      async () => { await apiClient.delete(`${ENDPOINT}/${id}`); },
    );
  },
};
