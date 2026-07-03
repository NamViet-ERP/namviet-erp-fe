import type { NavigateFunction } from 'react-router-dom';
import { showToast } from '../components/ui/Toast';
import { UI_COMING_SOON, UI_PERMISSION_DENIED } from './uiMessages';
import { hasAnyPermission, type PermissionKey } from './permissions';

export interface PermissionNavItem {
  label: string;
  path?: string;
  permission?: PermissionKey | PermissionKey[];
}

export function isNavItemAccessible(
  permissions: readonly PermissionKey[],
  item: PermissionNavItem,
): boolean {
  if (!item.path) return false;
  if (!item.permission) return true;
  return hasAnyPermission(permissions, item.permission);
}

export function handlePermissionNavClick(
  permissions: readonly PermissionKey[],
  item: PermissionNavItem,
  navigate: NavigateFunction,
  options?: { deptTitle?: string; onAfter?: () => void },
): void {
  if (!item.path) {
    showToast(
      'info',
      UI_COMING_SOON.module(item.label, options?.deptTitle ?? ''),
      UI_COMING_SOON.title,
    );
    options?.onAfter?.();
    return;
  }

  if (item.permission && !hasAnyPermission(permissions, item.permission)) {
    showToast(
      'warning',
      UI_PERMISSION_DENIED.message(item.label),
      UI_PERMISSION_DENIED.title,
    );
    options?.onAfter?.();
    return;
  }

  navigate(item.path);
  options?.onAfter?.();
}
