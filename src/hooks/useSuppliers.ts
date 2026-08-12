import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  suppliersService,
  type SupplierListParams,
  type UpsertSupplierBody,
} from '../services/suppliersService';
import { queryKeys } from '../services/queryKeys';
import { DEFAULT_LIST_PAGE_SIZE } from '../constants/pagination';

export function useSuppliers(params: SupplierListParams & { all?: boolean } = {}) {
  const page = params.all ? 1 : (params.page ?? 1);
  const pageSize = params.all ? 500 : (params.pageSize ?? DEFAULT_LIST_PAGE_SIZE);

  return useQuery({
    queryKey: [
      ...queryKeys.suppliers.all,
      params.all ? 'all' : page,
      pageSize,
      params.search ?? '',
      params.rating ?? '',
      params.groupId ?? 0,
      params.isBlacklisted ?? '',
      params.approvalStatus ?? '',
    ] as const,
    queryFn: () =>
      suppliersService.list({
        page,
        pageSize,
        search: params.search,
        rating: params.rating,
        groupId: params.groupId,
        isBlacklisted: params.isBlacklisted,
        approvalStatus: params.approvalStatus,
      }),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertSupplierBody) => suppliersService.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertSupplierBody }) =>
      suppliersService.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => suppliersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  });
}

export function useApproveSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => suppliersService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  });
}

export function useRejectSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => suppliersService.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  });
}
