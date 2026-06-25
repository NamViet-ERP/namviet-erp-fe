import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';
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
    return resolveMock(
      () => import('../mocks/services/categoriesService.mock').then((m) => m.getCategoryTreeMock()),
      () => apiClient.get<MaterialCategoryApiDto[]>(`${ENDPOINT}/tree`),
    );
  },

  async create(body: UpsertMaterialCategoryRequest): Promise<MaterialCategoryApiDto> {
    return resolveMock(
      () => import('../mocks/services/categoriesService.mock').then((m) => m.createCategoryMock(body)),
      () => apiClient.post<MaterialCategoryApiDto>(ENDPOINT, body),
    );
  },

  async update(id: number, body: UpsertMaterialCategoryRequest): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/categoriesService.mock').then((m) => m.updateCategoryMock(id, body)),
      async () => { await apiClient.put(`${ENDPOINT}/${id}`, body); },
    );
  },

  async remove(id: number): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/categoriesService.mock').then((m) => m.removeCategoryMock(id)),
      async () => { await apiClient.delete(`${ENDPOINT}/${id}`); },
    );
  },
};
