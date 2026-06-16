import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesService, type CreateRoleDto } from '../services/rolesService';
import { queryKeys } from '../services/queryKeys';

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: () => rolesService.listAsync(),
  });
}

export function useActiveRoleOptions() {
  return useQuery({
    queryKey: [...queryKeys.roles.all, 'active'] as const,
    queryFn: () => rolesService.listActiveOptions(),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoleDto) => rolesService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useToggleRoleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => rolesService.toggleStatus(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => rolesService.remove(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}
