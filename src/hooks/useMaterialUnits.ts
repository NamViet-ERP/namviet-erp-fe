import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  materialUnitsService,
  type UpsertMaterialUnitRequest,
} from '../services/materialUnitsService';
import { queryKeys } from '../services/queryKeys';

export function useMaterialUnits(activeOnly = false) {
  return useQuery({
    queryKey: [...queryKeys.materialUnits.all, activeOnly ? 'active' : 'all'],
    queryFn: () => materialUnitsService.list(activeOnly),
  });
}

export function useCreateMaterialUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMaterialUnitRequest) => materialUnitsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialUnits.all });
    },
  });
}

export function useUpdateMaterialUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertMaterialUnitRequest }) =>
      materialUnitsService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialUnits.all });
    },
  });
}

export function useDeleteMaterialUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialUnitsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materialUnits.all });
    },
  });
}
