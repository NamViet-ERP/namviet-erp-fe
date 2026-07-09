import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importsService, type CreateImportDto, type UpdateImportDto } from '../services/importsService';
import type { ApproveImportRequestApiDto } from '../types/api/importBudgetApi';
import { queryKeys } from '../services/queryKeys';
import type { Import } from '../types';
import type { VoucherListParams } from '../lib/wms/voucherDateUtils';

function invalidateImportSideEffects(qc: ReturnType<typeof useQueryClient>, imp?: Import | null) {
  qc.invalidateQueries({ queryKey: queryKeys.imports.all });
  qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
  qc.invalidateQueries({ queryKey: queryKeys.projects.all });
  const projectCode = imp?.project?.trim();
  if (projectCode) {
    qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectCode) });
    qc.invalidateQueries({ queryKey: queryKeys.projects.inventory(projectCode) });
    qc.invalidateQueries({ queryKey: queryKeys.projects.ledger(projectCode) });
  }
}

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
    onSuccess: data => invalidateImportSideEffects(qc, data),
  });
}

export function useUpdateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateImportDto }) =>
      importsService.update(id, dto),
    onSuccess: (data, { id }) => {
      invalidateImportSideEffects(qc, data);
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
    },
  });
}

export function useApproveImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmOverBudget }: { id: string; confirmOverBudget?: boolean }) =>
      importsService.approve(id, { confirmOverBudget } satisfies ApproveImportRequestApiDto),
    onSuccess: (data, { id }) => {
      invalidateImportSideEffects(qc, data);
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
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
