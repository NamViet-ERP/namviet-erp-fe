import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchasePaymentsService,
  type PurchasePaymentListParams,
} from '../services/purchasePaymentsService';
import { queryKeys } from '../services/queryKeys';
import type { CreatePurchasePaymentRequest } from '../types/api/poPaymentApi';

export function usePurchasePayments(params: PurchasePaymentListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.purchasePayments.all, params] as const,
    queryFn: () => purchasePaymentsService.list(params),
  });
}

export function usePurchasePayment(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.purchasePayments.detail(code ?? ''),
    queryFn: () => purchasePaymentsService.getByCode(code as string),
    enabled: Boolean(code),
  });
}

export function useCreatePurchasePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePurchasePaymentRequest) => purchasePaymentsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.purchasePayments.all });
      qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      qc.invalidateQueries({ queryKey: queryKeys.purchasingDashboard.all });
    },
  });
}

function useInvalidatePurchasePaymentQueries() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.purchasePayments.all });
    qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
    qc.invalidateQueries({ queryKey: queryKeys.purchasingDashboard.all });
  };
}

export function useSubmitPurchasePayment() {
  const invalidate = useInvalidatePurchasePaymentQueries();
  return useMutation({
    mutationFn: (code: string) => purchasePaymentsService.submit(code),
    onSuccess: invalidate,
  });
}

export function usePayPurchasePayment() {
  const invalidate = useInvalidatePurchasePaymentQueries();
  return useMutation({
    mutationFn: (code: string) => purchasePaymentsService.pay(code),
    onSuccess: invalidate,
  });
}

export function useCancelPurchasePayment() {
  const invalidate = useInvalidatePurchasePaymentQueries();
  return useMutation({
    mutationFn: (code: string) => purchasePaymentsService.cancel(code),
    onSuccess: invalidate,
  });
}
