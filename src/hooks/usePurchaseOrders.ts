import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseOrdersService,
  type PurchaseOrderListParams,
} from '../services/purchaseOrdersService';
import { queryKeys } from '../services/queryKeys';
import type {
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
} from '../types/api/purchasingApi';

export function usePurchaseOrders(params: PurchaseOrderListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.purchaseOrders.all, params] as const,
    queryFn: () => purchaseOrdersService.list(params),
  });
}

export function usePurchaseOrder(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.detail(code ?? ''),
    queryFn: () => purchaseOrdersService.getByCode(code as string),
    enabled: Boolean(code),
  });
}

function invalidatePurchaseOrders(qc: ReturnType<typeof useQueryClient>, code?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
  qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
  if (code) qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(code) });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePurchaseOrderRequest) => purchaseOrdersService.create(body),
    onSuccess: created => {
      invalidatePurchaseOrders(qc, created.code);
    },
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: UpdatePurchaseOrderRequest }) =>
      purchaseOrdersService.update(code, body),
    onSuccess: order => invalidatePurchaseOrders(qc, order.code),
  });
}

export function useApprovePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchaseOrdersService.approve(code),
    onSuccess: order => invalidatePurchaseOrders(qc, order.code),
  });
}

export function useUnapprovePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchaseOrdersService.unapprove(code),
    onSuccess: order => invalidatePurchaseOrders(qc, order.code),
  });
}

export function usePlacePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => purchaseOrdersService.place(code),
    onSuccess: order => invalidatePurchaseOrders(qc, order.code),
  });
}

export function usePurchaseOrderAttachments(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.attachments(code ?? ''),
    queryFn: () => purchaseOrdersService.listAttachments(code as string),
    enabled: Boolean(code),
  });
}
