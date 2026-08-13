import type { CreateSystemUserDto, SystemUser, SystemUserRole } from '../types/systemUser';

export type { CreateSystemUserDto, SystemUser, SystemUserRole };

/**
 * Session mirror for UI only (menu / labels).
 * Authorization is always enforced by the API (JWT + permissions) — never trust localStorage alone.
 */
const SESSION_USER_KEY = 'nv-session-user';
export const AUTH_CHANGED_EVENT = 'nv-auth-changed';

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
  return user?.permissions ? [...user.permissions] : [];
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
