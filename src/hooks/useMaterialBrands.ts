import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  materialBrandsService,
  type UpsertMaterialBrandRequest,
} from '../services/materialBrandsService';
import { queryKeys } from '../services/queryKeys';

export function useMaterialBrands(activeOnly = false) {
  return useQuery({
    queryKey: [...queryKeys.materialBrands.all, activeOnly ? 'active' : 'all'],
    queryFn: () => materialBrandsService.list(activeOnly),
  });
}

export function useCreateMaterialBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMaterialBrandRequest) => materialBrandsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialBrands.all });
    },
  });
}

export function useUpdateMaterialBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertMaterialBrandRequest }) =>
      materialBrandsService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialBrands.all });
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useDeleteMaterialBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialBrandsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialBrands.all });
    },
  });
}
