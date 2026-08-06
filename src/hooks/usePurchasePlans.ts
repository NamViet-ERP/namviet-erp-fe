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

function invalidatePlan(qc: ReturnType<typeof useQueryClient>, code: string) {
  qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
  qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.detail(code) });
}

export function useSubmitPurchasePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchasePlansService.submit(code),
    onSuccess: (_d, code) => invalidatePlan(qc, code),
  });
}

export function useApprovePurchasePlanL1() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchasePlansService.approveL1(code),
    onSuccess: (_d, code) => invalidatePlan(qc, code),
  });
}

export function useApprovePurchasePlanL2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchasePlansService.approveL2(code),
    onSuccess: (_d, code) => invalidatePlan(qc, code),
  });
}

export function useRejectPurchasePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, reason }: { code: string; reason?: string }) =>
      purchasePlansService.reject(code, { reason }),
    onSuccess: (_d, vars) => invalidatePlan(qc, vars.code),
  });
}

export function useRemakePurchasePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchasePlansService.remake(code),
    onSuccess: (created, sourceCode) => {
      invalidatePlan(qc, sourceCode);
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.detail(created.code) });
    },
  });
}

export function usePurchasePlanVariance(params: { planCode?: string; projectCode?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.purchasePlans.variance(params.planCode, params.projectCode),
    queryFn: () => purchasePlansService.getVariance(params),
  });
}
