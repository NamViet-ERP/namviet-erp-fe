import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defectsService } from '../services/defectsService';
import { queryKeys } from '../services/queryKeys';
import type { CreateDefectFromPoRequest } from '../types/api/poDefectApi';

export function useDefects(enabled = true) {
  return useQuery({
    queryKey: queryKeys.defects.all,
    queryFn: () => defectsService.list(),
    enabled,
  });
}

export function useDefect(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.defects.detail(id ?? ''),
    queryFn: () => defectsService.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function usePoDefectPreview(poCode: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.defects.poPreview(poCode ?? ''),
    queryFn: () => defectsService.previewFromPo(poCode!),
    enabled: enabled && Boolean(poCode),
  });
}

export function useCreateDefectFromPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poCode, request }: { poCode: string; request: CreateDefectFromPoRequest }) =>
      defectsService.createFromPo(poCode, request),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
    },
  });
}

export function useSubmitDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defectsService.submit(id),
    onSuccess: dto => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.detail(dto.ticketCode) });
    },
  });
}

export function useApproveDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defectsService.approve(id),
    onSuccess: dto => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.detail(dto.ticketCode) });
      void qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
    },
  });
}

export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defectsService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
    },
  });
}
