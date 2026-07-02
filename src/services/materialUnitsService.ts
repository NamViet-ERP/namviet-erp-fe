import { apiClient } from '../lib/apiClient';
import type { MaterialUnitApiDto } from '../types/wms';

export interface UpsertMaterialUnitRequest {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

const ENDPOINT = '/api/material-units';

export const materialUnitsService = {
  async list(activeOnly = false): Promise<MaterialUnitApiDto[]> {
    const qs = activeOnly ? '?activeOnly=true' : '';
    return apiClient.get<MaterialUnitApiDto[]>(`${ENDPOINT}${qs}`);
  },

  async create(body: UpsertMaterialUnitRequest): Promise<MaterialUnitApiDto> {
    return apiClient.post<MaterialUnitApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialUnitRequest): Promise<void> {
    await apiClient.put(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
