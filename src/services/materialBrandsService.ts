import { apiClient } from '../lib/apiClient';
import type { MaterialBrandApiDto, UpsertMaterialBrandRequest } from '../types/wms';

export type { UpsertMaterialBrandRequest };

const ENDPOINT = '/api/material-brands';

export const materialBrandsService = {
  async list(activeOnly = false): Promise<MaterialBrandApiDto[]> {
    const qs = activeOnly ? '?activeOnly=true' : '';
    return apiClient.get<MaterialBrandApiDto[]>(`${ENDPOINT}${qs}`);
  },

  async create(body: UpsertMaterialBrandRequest): Promise<MaterialBrandApiDto> {
    return apiClient.post<MaterialBrandApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialBrandRequest): Promise<MaterialBrandApiDto> {
    return apiClient.put<MaterialBrandApiDto>(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
