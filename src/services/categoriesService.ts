import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay } from '../lib/mock';
import treeSeed from '../data/materialCategoriesTree.json';
import type { MaterialCategoryApiDto } from '../types/wms';

const ENDPOINT = '/api/categories';

type TreeSeedItem = {
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
  sortOrder: number;
  isActive: boolean;
};

export interface UpsertMaterialCategoryRequest {
  code: string;
  name: string;
  level: number;
  parentId: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

function buildMockTree(): MaterialCategoryApiDto[] {
  const items = treeSeed as TreeSeedItem[];
  const codeToId = new Map<string, number>();
  let nextId = 1;
  for (const item of items) codeToId.set(item.code, nextId++);

  return items.map(item => ({
    id: codeToId.get(item.code)!,
    code: item.code,
    name: item.name,
    level: item.level,
    parentId: item.parentCode ? codeToId.get(item.parentCode) ?? null : null,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  }));
}

let mockTree = buildMockTree();

export function generateCategoryCode(): string {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  return `CAT-${hex}`;
}

export const categoriesService = {
  async getTree(): Promise<MaterialCategoryApiDto[]> {
    if (USE_MOCK) return mockDelay([...mockTree]);
    return apiClient.get<MaterialCategoryApiDto[]>(`${ENDPOINT}/tree`);
  },

  async create(body: UpsertMaterialCategoryRequest): Promise<MaterialCategoryApiDto> {
    if (USE_MOCK) {
      const id = Math.max(0, ...mockTree.map(c => c.id)) + 1;
      const created: MaterialCategoryApiDto = {
        id,
        code: body.code,
        name: body.name,
        level: body.level,
        parentId: body.parentId,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      };
      mockTree = [...mockTree, created];
      return mockDelay(created);
    }
    return apiClient.post<MaterialCategoryApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialCategoryRequest): Promise<void> {
    if (USE_MOCK) {
      mockTree = mockTree.map(c =>
        c.id === id
          ? {
              ...c,
              code: body.code,
              name: body.name,
              level: body.level,
              parentId: body.parentId,
              sortOrder: body.sortOrder ?? c.sortOrder,
              isActive: body.isActive ?? c.isActive,
            }
          : c,
      );
      return mockDelay(undefined);
    }
    await apiClient.put(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    if (USE_MOCK) {
      mockTree = mockTree.filter(c => c.id !== id);
      return mockDelay(undefined);
    }
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
