/**
 * Auth session: access JWT in memory (Bearer); refresh token in HttpOnly cookie (same-origin).
 * Access JWT is too large for cookies when packed with permission claims.
 */

export const REMEMBER_KEY = 'nv-remember-me';
/** @deprecated Legacy prefill key — cleared on logout; never store credentials. */
export const SAVED_USER_KEY = 'nv-saved-user';

/** @deprecated Legacy storage keys — cleared only. */
export const TOKEN_KEY = 'nv-access-token';
/** @deprecated */
export const REFRESH_KEY = 'nv-refresh-token';

let memoryAccessToken: string | null = null;

export function clearLegacyTokenStorage(): void {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(REFRESH_KEY);
  }
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(SAVED_USER_KEY);
}

export function clearAuthSession(): void {
  memoryAccessToken = null;
  clearLegacyTokenStorage();
  localStorage.removeItem('nv-logged-in');
  localStorage.removeItem('nv-session-user');
  localStorage.removeItem('nv-user-id');
  localStorage.removeItem('nv-user-role');
}

export function setAccessToken(token: string | null): void {
  memoryAccessToken = token && token.trim() ? token : null;
}

export function getStoredToken(): string | null {
  return memoryAccessToken;
}

export function hasAuthSession(): boolean {
  return Boolean(memoryAccessToken);
}

export function getStoredRefreshToken(): string | null {
  return null;
}

export function persistTokens(accessToken: string, _refreshToken: string, _rememberMe: boolean): void {
  clearLegacyTokenStorage();
  setAccessToken(accessToken);
}

export function setRememberMePreference(_rememberMe: boolean): void {
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(SAVED_USER_KEY);
}

export function isRememberMe(): boolean {
  return false;
}

export function getAccessTokenExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, skewMs = 60_000): boolean {
  const expMs = getAccessTokenExpiryMs(token);
  if (expMs == null) return false;
  return Date.now() >= expMs - skewMs;
}
