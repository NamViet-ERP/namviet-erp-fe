import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importsService, type CreateImportDto, type UpdateImportDto } from '../services/importsService';
import { queryKeys } from '../services/queryKeys';

/** List all import vouchers. */
export function useImports() {
  return useQuery({
    queryKey: queryKeys.imports.all,
    queryFn: () => importsService.list(),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.imports.all }),
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
