import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  materialsService,
  type MaterialListParams,
  type UpsertMaterialRequest,
} from '../services/materialsService';
import { queryKeys } from '../services/queryKeys';

export function useMaterials(params: MaterialListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.materials.all, params] as const,
    queryFn: () => materialsService.list(params),
  });
}

export function useMaterial(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.materials.detail(code ?? ''),
    queryFn: () => materialsService.getByCode(code as string),
    enabled: Boolean(code),
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMaterialRequest) => materialsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: UpsertMaterialRequest }) =>
      materialsService.update(code, body),
    onSuccess: (_data, { code }) => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
      qc.invalidateQueries({ queryKey: queryKeys.materials.detail(code) });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => materialsService.remove(code),
    onSuccess: (_data, code) => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
      qc.removeQueries({ queryKey: queryKeys.materials.detail(code) });
    },
  });
}

export function useDiscontinueMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => materialsService.discontinue(code),
    onSuccess: (_data, code) => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
      qc.invalidateQueries({ queryKey: queryKeys.materials.detail(code) });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}

export function useReactivateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => materialsService.reactivate(code),
    onSuccess: (_data, code) => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
      qc.invalidateQueries({ queryKey: queryKeys.materials.detail(code) });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}
