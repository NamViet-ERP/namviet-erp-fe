export type PermissionKey = string;

export function normalizePermissionRequirement(
  requirement: PermissionKey | PermissionKey[],
): PermissionKey[] {
  return Array.isArray(requirement) ? requirement : [requirement];
}

export function hasPermission(
  permissions: readonly PermissionKey[],
  required: PermissionKey,
): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(
  permissions: readonly PermissionKey[],
  required: PermissionKey | PermissionKey[],
): boolean {
  const keys = normalizePermissionRequirement(required);
  return keys.some(key => hasPermission(permissions, key));
}

export function hasAllPermissions(
  permissions: readonly PermissionKey[],
  required: PermissionKey | PermissionKey[],
): boolean {
  const keys = normalizePermissionRequirement(required);
  return keys.every(key => hasPermission(permissions, key));
}

export function filterByPermission<T extends { permission?: PermissionKey | PermissionKey[] }>(
  items: readonly T[],
  permissions: readonly PermissionKey[],
): T[] {
  return items.filter(item => {
    if (!item.permission) return true;
    return hasAnyPermission(permissions, item.permission);
  });
}

export function filterDepartments<
  TDept extends { items: Array<{ permission?: PermissionKey | PermissionKey[] }> },
>(departments: readonly TDept[], permissions: readonly PermissionKey[]): TDept[] {
  return departments
    .map(dept => ({
      ...dept,
      items: filterByPermission(dept.items, permissions),
    }))
    .filter(dept => dept.items.length > 0);
}
