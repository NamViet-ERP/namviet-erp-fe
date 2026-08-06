import { useQuery } from '@tanstack/react-query';
import {
  purchasePaymentPlansService,
  type PurchasePaymentPlanListParams,
} from '../services/purchasePaymentPlansService';
import { queryKeys } from '../services/queryKeys';

export function usePurchasePaymentPlans(params: PurchasePaymentPlanListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.purchasePaymentPlans.all, params] as const,
    queryFn: () => purchasePaymentPlansService.list(params),
  });
}

export function usePurchasePaymentNextStage(poCode: string | undefined) {
  return useQuery({
    queryKey: queryKeys.purchasePaymentPlans.nextStage(poCode ?? ''),
    queryFn: () => purchasePaymentPlansService.getNextStage(poCode as string),
    enabled: Boolean(poCode?.trim()),
  });
}
