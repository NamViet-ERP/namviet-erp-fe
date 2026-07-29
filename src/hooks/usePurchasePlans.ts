import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchasePlansService,
  type PurchasePlanListParams,
} from '../services/purchasePlansService';
import { queryKeys } from '../services/queryKeys';
import type {
  CreatePurchasePlanRequest,
  PurchasePlanImportConfirmRequest,
  UpdatePurchasePlanRequest,
} from '../types/api/purchasingApi';

export function usePurchasePlans(params: PurchasePlanListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.purchasePlans.all, params] as const,
    queryFn: () => purchasePlansService.list(params),
  });
}

export function usePurchasePlan(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.purchasePlans.detail(code ?? ''),
    queryFn: () => purchasePlansService.getByCode(code as string),
    enabled: Boolean(code),
  });
}

export function useCreatePurchasePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePurchasePlanRequest) => purchasePlansService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
    },
  });
}

export function useUpdatePurchasePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: UpdatePurchasePlanRequest }) =>
      purchasePlansService.update(code, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.detail(vars.code) });
    },
  });
}

export function useDeletePurchasePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchasePlansService.delete(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
    },
  });
}

export function usePurchasePlanImportTemplate() {
  return useMutation({
    mutationFn: () => purchasePlansService.downloadImportTemplate(),
  });
}

export function usePurchasePlanImportPreview() {
  return useMutation({
    mutationFn: ({ projectCode, file }: { projectCode: string; file: File }) =>
      purchasePlansService.importPreview(projectCode, file),
  });
}

export function usePurchasePlanImportConfirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PurchasePlanImportConfirmRequest) => purchasePlansService.importConfirm(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
    },
  });
}

export function usePurchasePlanVariance(params: { planCode?: string; projectCode?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.purchasePlans.variance(params.planCode, params.projectCode),
    queryFn: () => purchasePlansService.getVariance(params),
  });
}
