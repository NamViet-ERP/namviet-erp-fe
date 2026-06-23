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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers.all });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransferDto }) => transfersService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.transfers.all }),
  });
}

export function useApproveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersService.approve(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers.all });
      qc.invalidateQueries({ queryKey: queryKeys.transfers.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useSubmitTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersService.submit(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers.all });
      qc.invalidateQueries({ queryKey: queryKeys.transfers.detail(id) });
    },
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.transfers.all }),
  });
}
