import { useSession } from '../auth/AuthProvider';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type PermissionKey,
} from '../lib/permissions';

export function usePermission() {
  const { permissions } = useSession();

  return {
    permissions,
    has: (permission: PermissionKey) => hasPermission(permissions, permission),
    hasAny: (required: PermissionKey | PermissionKey[]) => hasAnyPermission(permissions, required),
    hasAll: (required: PermissionKey | PermissionKey[]) => hasAllPermissions(permissions, required),
  };
}
