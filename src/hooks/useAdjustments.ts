import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustmentsService, type CreateAdjustmentDto, type UpdateAdjustmentDto } from '../services/adjustmentsService';
import { queryKeys } from '../services/queryKeys';

export function useAdjustments() {
  return useQuery({ queryKey: queryKeys.adjustments.all, queryFn: () => adjustmentsService.list() });
}

export function useAdjustment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adjustments.detail(id ?? ''),
    queryFn: () => adjustmentsService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAdjustmentDto) => adjustmentsService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adjustments.all }),
  });
}

export function useUpdateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAdjustmentDto }) => adjustmentsService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adjustments.all }),
  });
}

export function useDeleteAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adjustmentsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adjustments.all }),
  });
}
