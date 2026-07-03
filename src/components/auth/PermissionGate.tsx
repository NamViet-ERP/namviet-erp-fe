import type { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';
import type { PermissionKey } from '../../lib/permissions';

interface PermissionGateProps {
  permission: PermissionKey | PermissionKey[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
}

export default function PermissionGate({
  permission,
  mode = 'any',
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasAny, hasAll } = usePermission();
  const allowed = mode === 'all' ? hasAll(permission) : hasAny(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
