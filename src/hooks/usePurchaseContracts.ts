import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseContractsService,
  type PurchaseContractListParams,
} from '../services/purchaseContractsService';
import type {
  CreatePurchaseContractRequest,
  UpdatePurchaseContractRequest,
} from '../types/api/purchasingApi';

const LIST_KEY = ['purchasing', 'contracts'] as const;

export function usePurchaseContracts(params: PurchaseContractListParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => purchaseContractsService.list(params),
  });
}

export function usePurchaseContract(id: string | undefined) {
  return useQuery({
    queryKey: [...LIST_KEY, 'detail', id],
    queryFn: () => purchaseContractsService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePurchaseContractRequest) => purchaseContractsService.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useUpdatePurchaseContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePurchaseContractRequest }) =>
      purchaseContractsService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useUploadPurchaseContractFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      purchaseContractsService.upload(id, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useDeletePurchaseContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseContractsService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useImportPurchaseContractsFromPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => purchaseContractsService.importFromPoAttachments(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
