import { apiClient } from '../lib/apiClient';
import type { MaterialRegionApiDto, UpsertMaterialRegionRequest } from '../types/wms';

export type { UpsertMaterialRegionRequest };

const ENDPOINT = '/api/material-regions';

export const materialRegionsService = {
  async list(activeOnly = false): Promise<MaterialRegionApiDto[]> {
    const qs = activeOnly ? '?activeOnly=true' : '';
    return apiClient.get<MaterialRegionApiDto[]>(`${ENDPOINT}${qs}`);
  },

  async create(body: UpsertMaterialRegionRequest): Promise<MaterialRegionApiDto> {
    return apiClient.post<MaterialRegionApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialRegionRequest): Promise<MaterialRegionApiDto> {
    return apiClient.put<MaterialRegionApiDto>(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
