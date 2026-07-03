import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  rolePermissionsService,
  type UpdateRolePermissionsApiDto,
} from '../services/rolePermissionsService';
import { queryKeys } from '../services/queryKeys';

export function usePermissionCatalog() {
  return useQuery({
    queryKey: queryKeys.rolePermissions.catalog,
    queryFn: () => rolePermissionsService.getCatalog(),
    staleTime: 5 * 60_000,
  });
}

export function useRolePermissions(roleCode: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rolePermissions.role(roleCode ?? ''),
    queryFn: () => rolePermissionsService.getRolePermissions(roleCode!),
    enabled: Boolean(roleCode),
  });
}

export function useUpdateRolePermissions(roleCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateRolePermissionsApiDto) =>
      rolePermissionsService.updateRolePermissions(roleCode, dto.permissions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rolePermissions.role(roleCode) });
    },
  });
}
