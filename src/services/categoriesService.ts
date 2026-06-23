import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
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
    if (USE_MOCK) {
      const mock = await import('./mocks/categoriesService.mock');
      return mock.getCategoryTreeMock();
    }
    return apiClient.get<MaterialCategoryApiDto[]>(`${ENDPOINT}/tree`);
  },

  async create(body: UpsertMaterialCategoryRequest): Promise<MaterialCategoryApiDto> {
    if (USE_MOCK) {
      const mock = await import('./mocks/categoriesService.mock');
      return mock.createCategoryMock(body);
    }
    return apiClient.post<MaterialCategoryApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialCategoryRequest): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/categoriesService.mock');
      return mock.updateCategoryMock(id, body);
    }
    await apiClient.put(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/categoriesService.mock');
      return mock.removeCategoryMock(id);
    }
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
