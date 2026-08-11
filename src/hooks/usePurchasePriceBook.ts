import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasePriceBookService } from '../services/purchasePriceBookService';
import type { UpsertPurchaseSellPriceRequest } from '../types/api/purchasingApi';

const KEY = ['purchasing', 'price-book'] as const;

export function usePriceBookItems(search?: string, categoryId?: number, enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'items', search, categoryId],
    queryFn: () => purchasePriceBookService.items(search, categoryId),
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
