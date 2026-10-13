import { apiClient } from '../lib/apiClient';
import type { MaterialOriginApiDto, UpsertMaterialOriginRequest } from '../types/wms';

export type { UpsertMaterialOriginRequest };

const ENDPOINT = '/api/material-origins';

export const materialOriginsService = {
  async list(activeOnly = false): Promise<MaterialOriginApiDto[]> {
    const qs = activeOnly ? '?activeOnly=true' : '';
    return apiClient.get<MaterialOriginApiDto[]>(`${ENDPOINT}${qs}`);
  },

  async create(body: UpsertMaterialOriginRequest): Promise<MaterialOriginApiDto> {
    return apiClient.post<MaterialOriginApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialOriginRequest): Promise<MaterialOriginApiDto> {
    return apiClient.put<MaterialOriginApiDto>(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
