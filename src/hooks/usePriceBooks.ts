import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  priceBooksService,
  type PriceBookListParams,
  type UpsertPriceBookBody,
} from '../services/priceBooksService';
import { queryKeys } from '../services/queryKeys';
import { DEFAULT_LIST_PAGE_SIZE } from '../constants/pagination';

export function usePriceBooks(params: PriceBookListParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE;

  return useQuery({
    queryKey: [
      ...queryKeys.priceBooks.all,
      page,
      pageSize,
      params.materialCode ?? '',
      params.supplierId ?? '',
      params.search ?? '',
    ] as const,
    queryFn: () =>
      priceBooksService.list({
        page,
        pageSize,
        materialCode: params.materialCode,
        supplierId: params.supplierId,
        search: params.search,
      }),
  });
}

export function useCreatePriceBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPriceBookBody) => priceBooksService.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.priceBooks.all }),
  });
}

export function useUpdatePriceBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertPriceBookBody }) =>
      priceBooksService.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.priceBooks.all }),
  });
}

export function useDeletePriceBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => priceBooksService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.priceBooks.all }),
  });
}
