import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersService, type CreateTransferDto, type UpdateTransferDto } from '../services/transfersService';
import { queryKeys } from '../services/queryKeys';

export function useTransfers() {
  return useQuery({ queryKey: queryKeys.transfers.all, queryFn: () => transfersService.list() });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transfers.detail(id ?? ''),
    queryFn: () => transfersService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTransferDto) => transfersService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.transfers.all }),
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransferDto }) => transfersService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.transfers.all }),
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.transfers.all }),
  });
}
