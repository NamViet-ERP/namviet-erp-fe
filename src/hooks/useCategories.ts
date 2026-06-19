import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MATERIAL_CATEGORY_LEVELS } from '../constants/materialCategoryLevels';
import {
  categoriesService,
  type UpsertMaterialCategoryRequest,
} from '../services/categoriesService';
import { queryKeys } from '../services/queryKeys';
import { childrenOf, distinctNamesAtLevel } from '../lib/wms/materialCategoryTree';
import type { MaterialCategoryApiDto } from '../types/wms';

export function useCategoryTree() {
  return useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: () => categoriesService.getTree(),
  });
}

/** Tùy chọn lọc tự do: mỗi cấp độc lập, không cascade */
export function useCategoryFilterOptions() {
  const { data: categories = [], ...rest } = useCategoryTree();

  const optionsByLevel = useMemo(
    () => MATERIAL_CATEGORY_LEVELS.map(lvl => distinctNamesAtLevel(categories, lvl.level)),
    [categories],
  );

  return { optionsByLevel, ...rest };
}

/** 5 cấp cascade — dùng cho form tạo mới */
export function useCategoryCascade(selectedByLevel: Array<number | ''>) {
  const { data: categories = [], ...rest } = useCategoryTree();

  const optionsByLevel = useMemo(() => {
    const result: MaterialCategoryApiDto[][] = [[], [], [], [], []];
    for (let level = 1; level <= 5; level++) {
      if (level > 1 && selectedByLevel[level - 2] === '') {
        result[level - 1] = [];
        continue;
      }
      const parentId =
        level === 1 ? null : (selectedByLevel[level - 2] as number);
      result[level - 1] = childrenOf(categories, parentId).filter(
        c => !(level === 1 && c.code === 'UNCATEGORIZED'),
      );
    }
    return result;
  }, [categories, selectedByLevel]);

  return { categories, optionsByLevel, ...rest };
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.tree });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertMaterialCategoryRequest }) =>
      categoriesService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.tree });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.tree });
    },
  });
}
