import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  materialRegionsService,
  type UpsertMaterialRegionRequest,
} from '../services/materialRegionsService';
import { queryKeys } from '../services/queryKeys';

export function useMaterialRegions(activeOnly = false) {
  return useQuery({
    queryKey: [...queryKeys.materialRegions.all, activeOnly ? 'active' : 'all'],
    queryFn: () => materialRegionsService.list(activeOnly),
  });
}

export function useCreateMaterialRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMaterialRegionRequest) => materialRegionsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialRegions.all });
    },
  });
}

export function useUpdateMaterialRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertMaterialRegionRequest }) =>
      materialRegionsService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialRegions.all });
      qc.invalidateQueries({ queryKey: queryKeys.materialOrigins.all });
    },
  });
}

export function useDeleteMaterialRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialRegionsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialRegions.all });
    },
  });
}
