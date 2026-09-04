import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasePriceBookService } from '../services/purchasePriceBookService';
import type {
  UpsertPurchaseItemEstimatePriceRequest,
  UpsertPurchaseSellPriceRequest,
} from '../types/api/purchasingApi';
import { queryKeys } from '../services/queryKeys';

const KEY = queryKeys.purchasePriceBook.all;

export function usePriceBookItems(
  search?: string,
  categoryId?: number,
  enabled = true,
  fromDate?: string,
  toDate?: string,
) {
  return useQuery({
    queryKey: [...KEY, 'items', search, categoryId, fromDate, toDate],
    queryFn: () => purchasePriceBookService.items(search, categoryId, fromDate, toDate),
    enabled,
  });
}

export function usePriceBookItem(code: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'item', code],
    queryFn: () => purchasePriceBookService.item(code!),
    enabled: Boolean(code),
  });
}

export function usePriceBookMatrix(categoryId: number | undefined) {
  return useQuery({
    queryKey: [...KEY, 'matrix', categoryId],
    queryFn: () => purchasePriceBookService.matrix(categoryId!),
    enabled: Boolean(categoryId),
  });
}

export function usePriceBookCategories(enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'categories'],
    queryFn: () => purchasePriceBookService.categories(),
    enabled,
  });
}

export function usePriceBookMargins(enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'margins'],
    queryFn: () => purchasePriceBookService.margins(),
    enabled,
  });
}

export function usePriceBookEstimates(enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'estimates'],
    queryFn: () => purchasePriceBookService.estimates(),
    enabled,
  });
}

export function useUpsertEstimatePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPurchaseItemEstimatePriceRequest) =>
      purchasePriceBookService.upsertEstimatePrice(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpsertSellPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPurchaseSellPriceRequest) =>
      purchasePriceBookService.upsertSellPrice(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
