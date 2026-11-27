import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import { serviceExpenseItemsService } from '../services/serviceExpenseItemsService';
import type {
  CreateServiceExpenseItemRequest,
  ServiceExpenseImportBatchRequest,
  ServiceExpenseItemQueryParams,
  UpdateServiceExpenseItemRequest,
} from '../types/api/serviceExpenseItem';

export function useServiceExpenseItems(
  params: ServiceExpenseItemQueryParams = {},
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery({
    queryKey: queryKeys.serviceExpenseItems.list(params),
    queryFn: () => serviceExpenseItemsService.list(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
  });
}

export function useCreateServiceExpenseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceExpenseItemRequest) => serviceExpenseItemsService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.serviceExpenseItems.all });
    },
  });
}

export function useUpdateServiceExpenseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceExpenseItemRequest }) =>
      serviceExpenseItemsService.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.serviceExpenseItems.all });
    },
  });
}

export function useToggleServiceExpenseItemActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => serviceExpenseItemsService.toggleActive(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.serviceExpenseItems.all });
    },
  });
}

export function useDeleteServiceExpenseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => serviceExpenseItemsService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.serviceExpenseItems.all });
    },
  });
}

export function useImportServiceExpenseItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: ServiceExpenseImportBatchRequest) =>
      serviceExpenseItemsService.importBatch(request),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.serviceExpenseItems.all });
    },
  });
}
