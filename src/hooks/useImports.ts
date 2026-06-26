import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importsService, type CreateImportDto, type UpdateImportDto } from '../services/importsService';
import { queryKeys } from '../services/queryKeys';
import type { VoucherListParams } from '../lib/wms/voucherDateUtils';

/** List all import vouchers. */
export function useImports(params?: VoucherListParams) {
  return useQuery({
    queryKey: [...queryKeys.imports.all, params?.dateFrom ?? '', params?.dateTo ?? ''],
    queryFn: () => importsService.list(params),
  });
}

/** Fetch a single import voucher by id. */
export function useImport(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.imports.detail(id ?? ''),
    queryFn: () => importsService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateImportDto) => importsService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.imports.all });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateImportDto }) =>
      importsService.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.imports.all });
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useApproveImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importsService.approve(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.imports.all });
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useSubmitImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importsService.submit(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.imports.all });
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
    },
  });
}

export function useDeleteImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.imports.all }),
  });
}
