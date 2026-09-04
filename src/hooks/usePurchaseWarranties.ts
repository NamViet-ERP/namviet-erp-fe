import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ClosePurchaseWarrantyClaimRequest,
  CreatePurchaseWarrantyClaimRequest,
} from '../types/api/purchasingApi';
import {
  purchaseWarrantiesService,
  type PurchaseWarrantyClaimListParams,
  type PurchaseWarrantyListParams,
  type UpdatePurchaseWarrantyRequest,
} from '../services/purchaseWarrantiesService';
import { queryKeys } from '../services/queryKeys';

const LIST_KEY = queryKeys.purchaseWarranties.all;

export function usePurchaseWarranties(params: PurchaseWarrantyListParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => purchaseWarrantiesService.list(params),
  });
}

export function usePurchaseWarrantyClaims(params: PurchaseWarrantyClaimListParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, 'claims', params],
    queryFn: () => purchaseWarrantiesService.listClaims(params),
  });
}

export function usePurchaseWarranty(id: string | undefined) {
  return useQuery({
    queryKey: [...LIST_KEY, 'detail', id],
    queryFn: () => purchaseWarrantiesService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useUpdatePurchaseWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdatePurchaseWarrantyRequest;
    }) => purchaseWarrantiesService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useCreateWarrantyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: CreatePurchaseWarrantyClaimRequest;
    }) => purchaseWarrantiesService.createClaim(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useCloseWarrantyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      body,
    }: {
      claimId: string;
      body: ClosePurchaseWarrantyClaimRequest;
    }) => purchaseWarrantiesService.closeClaim(claimId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useSyncPurchaseWarranties() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => purchaseWarrantiesService.syncFromReceipts(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
