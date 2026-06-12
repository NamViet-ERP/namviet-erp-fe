import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportsService, type CreateExportDto, type UpdateExportDto } from '../services/exportsService';
import { queryKeys } from '../services/queryKeys';

export function useExports() {
  return useQuery({ queryKey: queryKeys.exports.all, queryFn: () => exportsService.list() });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exports.all }),
  });
}

export function useUpdateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExportDto }) => exportsService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exports.all }),
  });
}

export function useDeleteExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exportsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exports.all }),
  });
}
