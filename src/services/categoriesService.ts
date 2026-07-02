import { apiClient } from '../lib/apiClient';
import type { MaterialCategoryApiDto } from '../types/wms';

const ENDPOINT = '/api/categories';

export interface UpsertMaterialCategoryRequest {
  code: string;
  name: string;
  level: number;
  parentId: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function generateCategoryCode(): string {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  return `CAT-${hex}`;
}

export const categoriesService = {
  async getTree(): Promise<MaterialCategoryApiDto[]> {
    return apiClient.get<MaterialCategoryApiDto[]>(`${ENDPOINT}/tree`);
  },

  async create(body: UpsertMaterialCategoryRequest): Promise<MaterialCategoryApiDto> {
    return apiClient.post<MaterialCategoryApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialCategoryRequest): Promise<void> {
    await apiClient.put(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
