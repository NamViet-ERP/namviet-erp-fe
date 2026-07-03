import { isAccountActiveForEmployee } from '../services/employeesService';
import { isActiveEmployee, type Employee } from '../types/hr';
import type { CreateSystemUserDto, SystemUser, SystemUserRole } from '../types/systemUser';
import { getPermissionsFromToken } from '../lib/jwtClaims';
import { getStoredToken } from '../lib/authSession';

export type { CreateSystemUserDto, SystemUser, SystemUserRole };

const SESSION_USER_KEY = 'nv-session-user';
const ACCOUNT_ENABLED_PREFIX = 'nv-user-enabled-';
export const AUTH_CHANGED_EVENT = 'nv-auth-changed';

export function isAccountManuallyEnabled(id: string): boolean {
  const raw = localStorage.getItem(`${ACCOUNT_ENABLED_PREFIX}${id}`);
  if (raw === null) return true;
  return raw !== 'false';
}

export function setAccountEnabled(id: string, enabled: boolean): void {
  localStorage.setItem(`${ACCOUNT_ENABLED_PREFIX}${id}`, enabled ? 'true' : 'false');
}

export function isUserAccountActive(user: SystemUser): boolean {
  const enableKey = user.employeeId ?? user.id;
  if (!isAccountManuallyEnabled(enableKey)) return false;
  return isAccountActiveForEmployee(user.employeeId);
}

export function isEmployeeLoginActive(employee: Pick<Employee, 'id' | 'status'>): boolean {
  if (!isAccountManuallyEnabled(employee.id)) return false;
  return isActiveEmployee(employee);
}

export function canUserLogin(user: SystemUser): boolean {
  return isUserAccountActive(user);
}

function readStoredSessionUser(): SystemUser | undefined {
  const raw = localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as SystemUser;
    if (parsed?.id && parsed?.username && parsed?.role) return parsed;
  } catch {
    /* ignore corrupt payload */
  }
  return undefined;
}

/** Session user persisted after API login (`authService.login` → `setSessionUser`). */
export function getSessionUser(): SystemUser | undefined {
  return readStoredSessionUser();
}

export function getSessionPermissions(): string[] {
  const user = readStoredSessionUser();
  if (user?.permissions?.length) return user.permissions;
  return getPermissionsFromToken(getStoredToken());
}

function notifyAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function setSessionUser(user: SystemUser): void {
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  localStorage.setItem('nv-user-id', user.id);
  localStorage.setItem('nv-user-role', user.role);
  notifyAuthChanged();
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('nv-user-id');
  localStorage.removeItem('nv-user-role');
  notifyAuthChanged();
}
