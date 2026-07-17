import { useEffect, useState } from 'react';
import { AUTH_CHANGED_EVENT, getSessionPermissions } from '../constants/systemUsers';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type PermissionKey,
} from '../lib/permissions';

export function usePermission() {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const onAuthChanged = () => setRevision(v => v + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);

  const permissions = getSessionPermissions();

  return {
    permissions,
    has: (permission: PermissionKey) => hasPermission(permissions, permission),
    hasAny: (required: PermissionKey | PermissionKey[]) => hasAnyPermission(permissions, required),
    hasAll: (required: PermissionKey | PermissionKey[]) => hasAllPermissions(permissions, required),
  };
}
