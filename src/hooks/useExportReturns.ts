import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  exportReturnsService,
  type CreateExportReturnDto,
} from '../services/exportReturnsService';
import { queryKeys } from '../services/queryKeys';
import type { VoucherListParams } from '../lib/wms/voucherDateUtils';

export function useExportReturns(params?: VoucherListParams) {
  return useQuery({
    queryKey: [...queryKeys.exportReturns.all, params?.dateFrom ?? '', params?.dateTo ?? ''],
    queryFn: () => exportReturnsService.list(params),
  });
}

export function useReturnableExports(projectCode: string | undefined, excludeReturnId?: string) {
  return useQuery({
    queryKey: queryKeys.exportReturns.returnableExports(projectCode ?? '', excludeReturnId),
    queryFn: () => exportReturnsService.listReturnableExports(projectCode as string, excludeReturnId),
    enabled: Boolean(projectCode),
  });
}

export function useReturnableLines(sourceExportId: string | undefined, excludeReturnId?: string) {
  return useQuery({
    queryKey: queryKeys.exportReturns.returnableLines(sourceExportId ?? '', excludeReturnId),
    queryFn: () => exportReturnsService.getReturnableLines(sourceExportId as string, excludeReturnId),
    enabled: Boolean(sourceExportId),
  });
}

export function useCreateExportReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExportReturnDto) => exportReturnsService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.all });
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.returnable });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateExportReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateExportReturnDto }) =>
      exportReturnsService.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.all });
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.returnable });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useApproveExportReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exportReturnsService.approve(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.all });
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.returnable });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useSubmitExportReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exportReturnsService.submit(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.all });
      qc.invalidateQueries({ queryKey: queryKeys.exportReturns.detail(id) });
    },
  });
}
