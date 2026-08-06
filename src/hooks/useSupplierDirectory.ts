import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  supplierContactsService,
  supplierDeliveryEvaluationsService,
  supplierEvaluationsService,
  supplierGroupsService,
  supplierModuleSettingsService,
  suppliersDashboardService,
  type SupplierDashboardParams,
  type SupplierDirectoryListParams,
} from '../services/supplierDirectoryService';
import { queryKeys } from '../services/queryKeys';
import type {
  CompleteSupplierDeliveryEvaluationRequest,
  UpdateSupplierModuleSettingsRequest,
  UpsertSupplierContactRequest,
  UpsertSupplierEvaluationRequest,
  UpsertSupplierGroupRequest,
} from '../types/api/supplierDirectoryApi';

export function useSupplierGroups(params: SupplierDirectoryListParams = {}) {
  const { search = '', page = 1, pageSize = 50 } = params;
  return useQuery({
    queryKey: [...queryKeys.supplierGroups.all, page, pageSize, search] as const,
    queryFn: () => supplierGroupsService.list({ search, page, pageSize }),
  });
}

export function useCreateSupplierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertSupplierGroupRequest) => supplierGroupsService.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.supplierGroups.all }),
  });
}

export function useUpdateSupplierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertSupplierGroupRequest }) =>
      supplierGroupsService.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.supplierGroups.all }),
  });
}

export function useDeleteSupplierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplierGroupsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.supplierGroups.all }),
  });
}

export function useSupplierGroupMembers(groupId: number | null) {
  return useQuery({
    queryKey: queryKeys.supplierGroups.members(groupId ?? 0),
    queryFn: () => supplierGroupsService.members(groupId as number),
    enabled: groupId !== null,
  });
}

export function useSetSupplierGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, supplierIds }: { groupId: number; supplierIds: number[] }) =>
      supplierGroupsService.setMembers(groupId, { supplierIds }),
    onSuccess: (_data, { groupId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierGroups.all });
      void qc.invalidateQueries({ queryKey: queryKeys.supplierGroups.members(groupId) });
    },
  });
}

export function useSupplierContacts(
  params: SupplierDirectoryListParams & { supplierId?: number } = {},
) {
  const { supplierId, search = '', page = 1, pageSize = 50 } = params;
  return useQuery({
    queryKey: [...queryKeys.supplierContacts.all, supplierId ?? 0, page, pageSize, search] as const,
    queryFn: () => supplierContactsService.list({ supplierId, search, page, pageSize }),
  });
}

export function useCreateSupplierContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertSupplierContactRequest) => supplierContactsService.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierContacts.all });
      void qc.invalidateQueries({ queryKey: queryKeys.suppliersDashboard.all });
    },
  });
}

export function useUpdateSupplierContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertSupplierContactRequest }) =>
      supplierContactsService.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.supplierContacts.all }),
  });
}

export function useDeleteSupplierContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplierContactsService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierContacts.all });
      void qc.invalidateQueries({ queryKey: queryKeys.suppliersDashboard.all });
    },
  });
}

export function useSupplierEvaluations(
  params: SupplierDirectoryListParams & { supplierId?: number; period?: string } = {},
) {
  const { supplierId, period = '', search = '', page = 1, pageSize = 50 } = params;
  return useQuery({
    queryKey: [
      ...queryKeys.supplierEvaluations.all,
      supplierId ?? 0,
      period,
      page,
      pageSize,
      search,
    ] as const,
    queryFn: () => supplierEvaluationsService.list({ supplierId, period, search, page, pageSize }),
  });
}

export function useCreateSupplierEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertSupplierEvaluationRequest) => supplierEvaluationsService.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierEvaluations.all });
      void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useUpdateSupplierEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertSupplierEvaluationRequest }) =>
      supplierEvaluationsService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierEvaluations.all });
      void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useDeleteSupplierEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplierEvaluationsService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierEvaluations.all });
      void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useSupplierDeliveryEvaluations(
  params: SupplierDirectoryListParams & {
    supplierId?: number;
    poCode?: string;
    status?: string;
  } = {},
) {
  const {
    supplierId,
    poCode = '',
    status = '',
    search = '',
    page = 1,
    pageSize = 50,
  } = params;
  return useQuery({
    queryKey: [
      ...queryKeys.supplierDeliveryEvaluations.all,
      supplierId ?? 0,
      poCode,
      status,
      page,
      pageSize,
      search,
    ] as const,
    queryFn: () => supplierDeliveryEvaluationsService.list({
      supplierId,
      poCode: poCode || undefined,
      status: status || undefined,
      search,
      page,
      pageSize,
    }),
  });
}

export function useCompleteSupplierDeliveryEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: CompleteSupplierDeliveryEvaluationRequest;
    }) => supplierDeliveryEvaluationsService.complete(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierDeliveryEvaluations.all });
      void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useSupplierModuleSettings() {
  return useQuery({
    queryKey: queryKeys.supplierModuleSettings.all,
    queryFn: () => supplierModuleSettingsService.get(),
  });
}

export function useUpdateSupplierModuleSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSupplierModuleSettingsRequest) =>
      supplierModuleSettingsService.update(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.supplierModuleSettings.all });
      // Ngưỡng điểm đổi thì xếp hạng của đánh giá mới sẽ khác.
      void qc.invalidateQueries({ queryKey: queryKeys.supplierEvaluations.all });
    },
  });
}

export function useSuppliersDashboard(params: SupplierDashboardParams = {}) {
  return useQuery({
    queryKey: queryKeys.suppliersDashboard.detail(params),
    queryFn: () => suppliersDashboardService.get(params),
  });
}
