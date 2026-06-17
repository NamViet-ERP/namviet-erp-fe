export const TOKEN_KEY = 'nv-access-token';
export const REFRESH_KEY = 'nv-refresh-token';
export const REMEMBER_KEY = 'nv-remember-me';
export const SAVED_USER_KEY = 'nv-saved-user';

export function isRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === 'true';
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY) ?? localStorage.getItem(REFRESH_KEY);
}

export function persistTokens(accessToken: string, refreshToken: string, rememberMe: boolean): void {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(REFRESH_KEY);
  }

  const target = rememberMe ? localStorage : sessionStorage;
  target.setItem(TOKEN_KEY, accessToken);
  target.setItem(REFRESH_KEY, refreshToken);

  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function setRememberMePreference(rememberMe: boolean, savedUser?: string): void {
  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, 'true');
    if (savedUser) localStorage.setItem(SAVED_USER_KEY, savedUser);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(SAVED_USER_KEY);
  }
}

export function clearAuthSession(): void {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(REFRESH_KEY);
  }
  localStorage.removeItem('nv-logged-in');
  localStorage.removeItem('nv-session-user');
  localStorage.removeItem('nv-user-id');
  localStorage.removeItem('nv-user-role');
}

export function hasAuthSession(): boolean {
  return Boolean(getStoredToken() || getStoredRefreshToken());
}

/** JWT exp claim in seconds, or null if unreadable. */
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
