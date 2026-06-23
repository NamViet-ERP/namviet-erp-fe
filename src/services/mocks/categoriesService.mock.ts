import { mockDelay } from '../../lib/mock';
import treeSeed from '../../data/materialCategoriesTree.json';
import type { MaterialCategoryApiDto } from '../../types/wms';
import type { UpsertMaterialCategoryRequest } from '../categoriesService';

type TreeSeedItem = {
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
  sortOrder: number;
  isActive: boolean;
};

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

export async function getCategoryTreeMock(): Promise<MaterialCategoryApiDto[]> {
  return mockDelay([...mockTree]);
}

export async function createCategoryMock(
  body: UpsertMaterialCategoryRequest,
): Promise<MaterialCategoryApiDto> {
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

export async function updateCategoryMock(id: number, body: UpsertMaterialCategoryRequest): Promise<void> {
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

export async function removeCategoryMock(id: number): Promise<void> {
  mockTree = mockTree.filter(c => c.id !== id);
  return mockDelay(undefined);
}
