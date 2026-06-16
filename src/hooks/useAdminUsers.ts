import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUsersService, type AdminUserSource } from '../services/adminUsersService';
import type { CreateSystemUserDto } from '../constants/systemUsers';
import { queryKeys } from '../services/queryKeys';

const adminUsersQueryKey = [...queryKeys.employees.all, 'adminUsers'] as const;

/** Danh sách đồng bộ từ quản lý nhân viên + tài khoản thủ công */
export function useAdminUsers() {
  return useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: () => adminUsersService.list(),
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSystemUserDto) => adminUsersService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
}

export function useToggleAdminUserStatus() {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
}
