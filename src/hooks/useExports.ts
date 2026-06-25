import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportsService, type CreateExportDto, type UpdateExportDto } from '../services/exportsService';
import { queryKeys } from '../services/queryKeys';
import type { VoucherListParams } from '../lib/wms/voucherDateUtils';

export function useExports(params?: VoucherListParams) {
  return useQuery({
    queryKey: [...queryKeys.exports.all, params?.dateFrom ?? '', params?.dateTo ?? ''],
    queryFn: () => exportsService.list(params),
  });
}

export function useExport(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.exports.detail(id ?? ''),
    queryFn: () => exportsService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExportDto) => exportsService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exports.all });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExportDto }) => exportsService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exports.all }),
  });
}

export function useApproveExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exportsService.approve(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.exports.all });
      qc.invalidateQueries({ queryKey: queryKeys.exports.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useSubmitExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exportsService.submit(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.exports.all });
      qc.invalidateQueries({ queryKey: queryKeys.exports.detail(id) });
    },
  });
}

export function useDeleteExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exportsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exports.all }),
  });
}
