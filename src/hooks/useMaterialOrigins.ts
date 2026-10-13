import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  materialOriginsService,
  type UpsertMaterialOriginRequest,
} from '../services/materialOriginsService';
import { queryKeys } from '../services/queryKeys';

export function useMaterialOrigins(activeOnly = false) {
  return useQuery({
    queryKey: [...queryKeys.materialOrigins.all, activeOnly ? 'active' : 'all'],
    queryFn: () => materialOriginsService.list(activeOnly),
  });
}

export function useCreateMaterialOrigin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMaterialOriginRequest) => materialOriginsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialOrigins.all });
    },
  });
}

export function useUpdateMaterialOrigin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertMaterialOriginRequest }) =>
      materialOriginsService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialOrigins.all });
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useDeleteMaterialOrigin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialOriginsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialOrigins.all });
    },
  });
}
