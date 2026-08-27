import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseEstimatesService,
  type PurchaseEstimateListParams,
} from '../services/purchaseEstimatesService';
import { queryKeys } from '../services/queryKeys';
import type {
  CreatePurchaseEstimateRequest,
  SubmitPublicPurchaseEstimateRequest,
  UpdatePurchaseEstimateRequest,
} from '../types/api/purchasingApi';

const LIST_KEY = ['purchasing', 'estimates'] as const;

export function usePurchaseEstimates(params: PurchaseEstimateListParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => purchaseEstimatesService.list(params),
  });
}

export function usePurchaseEstimate(id: string | undefined, version?: number) {
  return useQuery({
    queryKey: [...LIST_KEY, 'detail', id, version],
    queryFn: () => purchaseEstimatesService.getById(id!, version),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePurchaseEstimateRequest) => purchaseEstimatesService.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useUpdatePurchaseEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePurchaseEstimateRequest }) =>
      purchaseEstimatesService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useShareEstimateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseEstimatesService.shareLink(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useRevokeEstimateShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseEstimatesService.revokeShare(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useReviewPurchaseEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseEstimatesService.review(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useSubmitEstimateApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseEstimatesService.submitApproval(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
      void qc.invalidateQueries({ queryKey: queryKeys.wmsNotifications.pending });
    },
  });
}

export function useApproveEstimateL1() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string | null }) =>
      purchaseEstimatesService.approveL1(id, { note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
      void qc.invalidateQueries({ queryKey: queryKeys.wmsNotifications.pending });
    },
  });
}

export function useApproveEstimateL2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string | null }) =>
      purchaseEstimatesService.approveL2(id, { note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useRejectEstimateApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string | null }) =>
      purchaseEstimatesService.reject(id, { note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
      void qc.invalidateQueries({ queryKey: queryKeys.wmsNotifications.pending });
    },
  });
}

export function useConvertEstimateToPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseEstimatesService.convertPlan(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
      void qc.invalidateQueries({ queryKey: ['purchasing', 'plans'] });
    },
  });
}

export function usePublicPurchaseEstimate(token: string | undefined) {
  return useQuery({
    queryKey: [...LIST_KEY, 'public', token],
    queryFn: () => purchaseEstimatesService.getPublic(token!),
    enabled: Boolean(token),
  });
}

export function useSubmitPublicPurchaseEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ token, body }: { token: string; body: SubmitPublicPurchaseEstimateRequest }) =>
      purchaseEstimatesService.submitPublic(token, body),
    onSuccess: (_data, { token }) => {
      void qc.invalidateQueries({ queryKey: [...LIST_KEY, 'public', token] });
    },
  });
}
