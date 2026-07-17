import type { MaterialCategoryApiDto, MaterialCategoryPathApiDto } from '../../types/wms';

const UNCATEGORIZED_CODE = 'UNCATEGORIZED';

export function childrenOf(
  categories: MaterialCategoryApiDto[],
  parentId: number | null,
): MaterialCategoryApiDto[] {
  return categories
    .filter(c => c.parentId === parentId && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'));
}

export function resolveLeafCategoryId(
  selectedByLevel: Array<number | ''>,
): number | undefined {
  const ids = selectedByLevel.filter((v): v is number => v !== '');
  if (ids.length === 0) return undefined;
  return ids[ids.length - 1];
}

/** Tất cả id node gốc + con cháu — dùng lọc theo cây danh mục. */
export function collectSelfAndDescendantIds(
  rootId: number,
  categories: MaterialCategoryApiDto[],
): Set<number> {
  const childrenByParent = new Map<number, number[]>();
  for (const c of categories) {
    if (c.parentId != null) {
      const list = childrenByParent.get(c.parentId) ?? [];
      list.push(c.id);
      childrenByParent.set(c.parentId, list);
    }
  }
  const result = new Set<number>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const childId of childrenByParent.get(id) ?? []) {
      if (result.add(childId)) queue.push(childId);
    }
  }
  return result;
}

export function buildPathMap(
  categories: MaterialCategoryApiDto[],
): Map<number, { danhMuc: string | null; nhomVatTu: string | null; loaiVatTu: string | null; phanLoai: string | null; kieu: string | null }> {
  const byId = new Map(categories.map(c => [c.id, c]));
  const result = new Map<number, ReturnType<typeof buildPathMap> extends Map<number, infer V> ? V : never>();

  for (const cat of categories) {
    const levels: Array<string | null> = [null, null, null, null, null];
    let current: MaterialCategoryApiDto | undefined = cat;
    while (current) {
      if (current.level >= 1 && current.level <= 5)
        levels[current.level - 1] = current.name;
      current = current.parentId != null ? byId.get(current.parentId) : undefined;
    }
    result.set(cat.id, {
      danhMuc: levels[0],
      nhomVatTu: levels[1],
      loaiVatTu: levels[2],
      phanLoai: levels[3],
      kieu: levels[4],
    });
  }
  return result;
}

export function distinctNamesAtLevel(
  categories: MaterialCategoryApiDto[],
  level: number,
): string[] {
  const names = new Set<string>();
  for (const c of categories) {
    if (c.level !== level || !c.isActive) continue;
    if (level === 1 && c.code === UNCATEGORIZED_CODE) continue;
    names.add(c.name.trim());
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'vi'));
}

function equalsName(actual: string | null | undefined, expected: string): boolean {
  return actual?.trim().toLowerCase() === expected.trim().toLowerCase();
}

export function matchesPathFilter(
  path: MaterialCategoryPathApiDto,
  filters: {
    danhMuc?: string;
    nhomVatTu?: string;
    loaiVatTu?: string;
    phanLoai?: string;
    kieu?: string;
  },
): boolean {
  if (filters.danhMuc && !equalsName(path.danhMuc, filters.danhMuc)) return false;
  if (filters.nhomVatTu && !equalsName(path.nhomVatTu, filters.nhomVatTu)) return false;
  if (filters.loaiVatTu && !equalsName(path.loaiVatTu, filters.loaiVatTu)) return false;
  if (filters.phanLoai && !equalsName(path.phanLoai, filters.phanLoai)) return false;
  if (filters.kieu && !equalsName(path.kieu, filters.kieu)) return false;
  return true;
}

export function categoryLevel(
  categories: MaterialCategoryApiDto[],
  categoryId: number,
): number | undefined {
  return categories.find(c => c.id === categoryId)?.level;
}

/** Khôi phục chuỗi chọn cascade từ categoryId (leaf hoặc node bất kỳ). */
export function selectionFromCategoryId(
  categories: MaterialCategoryApiDto[],
  categoryId: number,
): Array<number | ''> {
  const byId = new Map(categories.map(c => [c.id, c]));
  const chain: number[] = [];
  let current = byId.get(categoryId);
  while (current) {
    chain.unshift(current.id);
    current = current.parentId != null ? byId.get(current.parentId) : undefined;
  }
  const result: Array<number | ''> = ['', '', '', '', ''];
  chain.forEach((id, i) => {
    if (i < 5) result[i] = id;
  });
  return result;
}
