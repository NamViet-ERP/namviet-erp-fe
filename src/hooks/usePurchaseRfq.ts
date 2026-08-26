import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseRfqService,
  type PurchaseRfqChipParams,
  type PurchaseRfqListParams,
} from '../services/purchaseRfqService';
import type { UpsertPurchaseRfqQuoteRequest } from '../types/api/purchasingApi';

const LIST_KEY = ['purchasing', 'rfq'] as const;

export function usePurchaseRfqQuotes(params: PurchaseRfqListParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => purchaseRfqService.list(params),
  });
}

export function usePurchaseRfqAverages(groupBy: 'quarter' | 'year', params: PurchaseRfqChipParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, 'averages', groupBy, params],
    queryFn: () => purchaseRfqService.averages(groupBy, params),
  });
}

export function usePurchaseRfqWinRates(params: PurchaseRfqChipParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, 'win-rates', params],
    queryFn: () => purchaseRfqService.winRates(params),
  });
}

export function useCreatePurchaseRfqQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPurchaseRfqQuoteRequest) => purchaseRfqService.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useUpdatePurchaseRfqQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpsertPurchaseRfqQuoteRequest }) =>
      purchaseRfqService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
