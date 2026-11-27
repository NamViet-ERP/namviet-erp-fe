import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  materialsService,
  type MaterialApiDto,
  type MaterialListParams,
  type UpsertMaterialRequest,
} from '../services/materialsService';
import { queryKeys } from '../services/queryKeys';

export function useMaterials(
  params: MaterialListParams = {},
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery({
    queryKey: [...queryKeys.materials.all, params] as const,
    queryFn: () => materialsService.list(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
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
    onSuccess: async (_data, { code, body }) => {
      const nextCode = body.materialCode?.trim();
      if (nextCode && nextCode !== code) {
        await qc.cancelQueries({ queryKey: queryKeys.materials.detail(code) });
        const prev = qc.getQueryData<MaterialApiDto>(queryKeys.materials.detail(code));
        if (prev) {
          qc.setQueryData<MaterialApiDto>(queryKeys.materials.detail(nextCode), {
            ...prev,
            materialCode: nextCode,
            materialName: body.materialName,
            categoryId: body.categoryId,
            unit: body.unit,
            origin: body.origin ?? null,
            imageUrl: body.imageUrl ?? null,
            technicalSpec: body.technicalSpec ?? null,
            generalTechnicalSpec: body.generalTechnicalSpec ?? null,
            qualityStandard: body.qualityStandard ?? null,
            ceilingPrice: body.ceilingPrice ?? null,
            abcClass: body.abcClass ?? null,
            isConsumable: body.isConsumable ?? prev.isConsumable,
          });
        }
        await qc.invalidateQueries({
          queryKey: queryKeys.materials.all,
          predicate: query =>
            !(Array.isArray(query.queryKey) && query.queryKey[0] === 'materials' && query.queryKey[1] === code),
        });
        await qc.invalidateQueries({ queryKey: queryKeys.materials.detail(nextCode) });
        await qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
        await qc.invalidateQueries({ queryKey: queryKeys.projects.all });
        await qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
        await qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
        return;
      }
      await qc.invalidateQueries({ queryKey: queryKeys.materials.all });
      await qc.invalidateQueries({ queryKey: queryKeys.materials.detail(code) });
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
