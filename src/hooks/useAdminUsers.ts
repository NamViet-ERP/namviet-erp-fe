import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  adminUsersService,
  rowMatchesListFilters,
  type AdminUserListParams,
  type AdminUserPagedResult,
  type AdminUserRow,
  type AdminUserSource,
  type ChangeAdminUserRoleDto,
  type CreateManualAccountDto,
  type ProvisionAccountDto,
  type ResetPasswordDto,
} from '../services/adminUsersService';
import { queryKeys } from '../services/queryKeys';

const adminUsersQueryKey = queryKeys.adminUsers.all;

export function adminUsersListQueryKey(params: AdminUserListParams) {
  return [...adminUsersQueryKey, params] as const;
}

function patchPagedToggle(
  old: AdminUserPagedResult | undefined,
  toggleId: string,
  enabled: boolean,
  source: AdminUserSource,
  listParams?: AdminUserListParams,
): AdminUserPagedResult | undefined {
  if (!old?.items) return old;

  const target = old.items.find(row => row.toggleId === toggleId && row.source === source);
  if (!target) return old;

  const updatedRow: AdminUserRow = {
    ...target,
    isActive: enabled,
    statusLabel: target.hasAccount ? (enabled ? 'Hoạt động' : 'Khóa') : target.statusLabel,
  };

  const stillMatches = !listParams || rowMatchesListFilters(updatedRow, listParams);
  const items = stillMatches
    ? old.items.map(row => (row.toggleId === toggleId && row.source === source ? updatedRow : row))
    : old.items.filter(row => !(row.toggleId === toggleId && row.source === source));

  const totalCount = stillMatches ? old.totalCount : Math.max(0, old.totalCount - 1);
  const totalPages = Math.max(1, Math.ceil(totalCount / old.pageSize));
  const page = Math.min(old.page, totalPages);

  return {
    ...old,
    items,
    totalCount,
    totalPages,
    page,
    summary: old.summary
      ? {
          ...old.summary,
          active: old.summary.active + (enabled ? 1 : -1),
          inactive: old.summary.inactive + (enabled ? -1 : 1),
        }
      : old.summary,
  };
}

export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: adminUsersListQueryKey(params),
    queryFn: () => adminUsersService.list(params),
    placeholderData: prev => prev,
  });
}

export function useAdminUser(id: string | undefined, source: AdminUserSource) {
  return useQuery({
    queryKey: queryKeys.adminUsers.detail(id ?? '', source),
    queryFn: () => adminUsersService.getById(id as string, source),
    enabled: Boolean(id),
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateManualAccountDto) => adminUsersService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
}

export function useProvisionAdminAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ProvisionAccountDto) => adminUsersService.provisionAccount(dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: adminUsersQueryKey });
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({
        queryKey: queryKeys.adminUsers.detail(variables.employeeId, 'employee'),
      });
    },
  });
}

export function useResetAdminPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => adminUsersService.resetPassword(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
}

export function useChangeAdminUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ChangeAdminUserRoleDto) => adminUsersService.changeRole(dto),
    onSuccess: (user, variables) => {
      qc.setQueriesData<AdminUserPagedResult>({ queryKey: adminUsersQueryKey }, old => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map(row =>
            row.toggleId === variables.toggleId && row.source === variables.source ? user : row,
          ),
        };
      });
      qc.setQueryData(
        queryKeys.adminUsers.detail(variables.toggleId, variables.source),
        user,
      );
    },
  });
}

export function useToggleAdminUserStatus(listParams?: AdminUserListParams) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      toggleId,
      enabled,
      source,
    }: {
      toggleId: string;
      enabled: boolean;
      source: AdminUserSource;
    }) => adminUsersService.toggleStatus(toggleId, enabled, source),
    onSuccess: (_data, { toggleId, enabled, source }) => {
      if (listParams) {
        qc.setQueryData<AdminUserPagedResult>(adminUsersListQueryKey(listParams), old =>
          patchPagedToggle(old, toggleId, enabled, source, listParams),
        );
      } else {
        qc.setQueriesData<AdminUserPagedResult>({ queryKey: adminUsersQueryKey }, old =>
          patchPagedToggle(old, toggleId, enabled, source),
        );
      }

      qc.setQueryData(
        queryKeys.adminUsers.detail(toggleId, source),
        (old: AdminUserRow | undefined) => {
          if (!old) return old;
          return {
            ...old,
            isActive: enabled,
            statusLabel: old.hasAccount ? (enabled ? 'Hoạt động' : 'Khóa') : old.statusLabel,
          };
        },
      );
    },
  });
}
