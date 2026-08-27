import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defectsService } from '../services/defectsService';
import { queryKeys } from '../services/queryKeys';
import type {
  CreateDefectFromPoRequest,
  CreateDefectFromStockRequest,
  UpdateDefectItemsRequest,
  UpdateDefectProcessingRequest,
} from '../types/api/poDefectApi';

export function useDefects(enabled = true) {
  return useQuery({
    queryKey: queryKeys.defects.all,
    queryFn: () => defectsService.list(),
    enabled,
  });
}

export function usePoDefectPreview(poCode: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.defects.poPreview(poCode ?? ''),
    queryFn: () => defectsService.previewFromPo(poCode!),
    enabled: enabled && Boolean(poCode),
  });
}

export function useEligibleDefectPurchaseOrders(enabled = true) {
  return useQuery({
    queryKey: queryKeys.defects.eligiblePos,
    queryFn: () => defectsService.listEligiblePurchaseOrders(),
    enabled,
  });
}

export function useStockDefectPreview(projectCode: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.defects.stockPreview(projectCode ?? ''),
    queryFn: () => defectsService.previewFromStock(projectCode!),
    enabled: enabled && Boolean(projectCode),
  });
}

export function useCreateDefectFromPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poCode, request }: { poCode: string; request: CreateDefectFromPoRequest }) =>
      defectsService.createFromPo(poCode, request),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.eligiblePos });
      void qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}

export function useCreateDefectFromStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateDefectFromStockRequest) => defectsService.createFromStock(request),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
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
      void qc.invalidateQueries({ queryKey: queryKeys.defects.eligiblePos });
      void qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
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
      void qc.invalidateQueries({ queryKey: queryKeys.defects.eligiblePos });
      void qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
      void qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}

export function useUpdateDefectProcessing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDefectProcessingRequest }) =>
      defectsService.updateProcessing(id, request),
    onSuccess: dto => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.detail(dto.ticketCode) });
    },
  });
}

export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defectsService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.eligiblePos });
      void qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}

export function useUpdateDefectItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDefectItemsRequest }) =>
      defectsService.updateItems(id, request),
    onSuccess: dto => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.detail(dto.ticketCode) });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.eligiblePos });
      void qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}

export function useCancelDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defectsService.cancel(id),
    onSuccess: dto => {
      void qc.invalidateQueries({ queryKey: queryKeys.defects.all });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.detail(dto.ticketCode) });
      void qc.invalidateQueries({ queryKey: queryKeys.defects.eligiblePos });
      void qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}
