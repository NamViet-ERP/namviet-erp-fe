/**
 * Auth session: access JWT in memory (Bearer); refresh token in HttpOnly cookie (same-origin).
 * Access JWT is too large for cookies when packed with permission claims.
 */

import { resolveSessionExpired } from './sessionExpiry';

export const REMEMBER_KEY = 'nv-remember-me';
/** @deprecated Legacy prefill key — cleared on logout; never store credentials. */
export const SAVED_USER_KEY = 'nv-saved-user';

/** @deprecated Legacy storage keys — cleared only. */
export const TOKEN_KEY = 'nv-access-token';
/** @deprecated */
export const REFRESH_KEY = 'nv-refresh-token';

let memoryAccessToken: string | null = null;
const accessTokenListeners = new Set<() => void>();

/** Playwright-only: access JWT in localStorage so storageState can reuse it across tests. */
const E2E_ACCESS_TOKEN_KEY = 'nv-e2e-access-token';

function isE2E(): boolean {
  return import.meta.env.VITE_E2E === 'true';
}

function emitAccessTokenChanged(): void {
  accessTokenListeners.forEach(listener => listener());
}

/** Subscribe to access-token set/clear (used by proactive refresh scheduler). */
export function subscribeAccessToken(listener: () => void): () => void {
  accessTokenListeners.add(listener);
  return () => accessTokenListeners.delete(listener);
}

export function clearLegacyTokenStorage(): void {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(REFRESH_KEY);
  }
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(SAVED_USER_KEY);
}

const AUTH_CHANNEL_NAME = 'nv-auth-session';
let authChannel: BroadcastChannel | null = null;

interface AuthChannelMessage {
  type: 'TOKEN_UPDATED' | 'LOGOUT';
  token?: string | null;
}

function getAuthChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!authChannel) {
    try {
      authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      authChannel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'TOKEN_UPDATED') {
          if (data.token && data.token !== memoryAccessToken) {
            setAccessTokenInternal(data.token, false);
          }
          resolveSessionExpired();
        } else if (data.type === 'LOGOUT') {
          clearAuthSessionInternal(false);
        }
      };
    } catch {
      authChannel = null;
    }
  }
  return authChannel;
}

function broadcastAuthMessage(message: AuthChannelMessage): void {
  try {
    getAuthChannel()?.postMessage(message);
  } catch {
    // ignore
  }
}

function clearAuthSessionInternal(broadcast = true): void {
  memoryAccessToken = null;
  // Keep nv-e2e-access-token in E2E so Playwright storageState / same-tab recovery still work
  // after a failed cookie refresh.
  clearLegacyTokenStorage();
  localStorage.removeItem('nv-logged-in');
  localStorage.removeItem('nv-session-user');
  localStorage.removeItem('nv-user-id');
  localStorage.removeItem('nv-user-role');
  emitAccessTokenChanged();
  if (broadcast) {
    broadcastAuthMessage({ type: 'LOGOUT' });
  }
}

export function clearAuthSession(): void {
  clearAuthSessionInternal(true);
}

function setAccessTokenInternal(token: string | null, broadcast = true): void {
  const next = token && token.trim() ? token.trim() : null;
  if (memoryAccessToken === next) return;
  memoryAccessToken = next;
  if (isE2E()) {
    try {
      if (memoryAccessToken) localStorage.setItem(E2E_ACCESS_TOKEN_KEY, memoryAccessToken);
      else localStorage.removeItem(E2E_ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
  }
  emitAccessTokenChanged();
  if (broadcast && memoryAccessToken) {
    broadcastAuthMessage({ type: 'TOKEN_UPDATED', token: memoryAccessToken });
  }
}

export function setAccessToken(token: string | null): void {
  setAccessTokenInternal(token, true);
}

if (typeof window !== 'undefined') {
  getAuthChannel();
}

export function getStoredToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  if (!isE2E()) return null;
  try {
    const fromLocal = localStorage.getItem(E2E_ACCESS_TOKEN_KEY);
    if (fromLocal?.trim()) {
      memoryAccessToken = fromLocal.trim();
      return memoryAccessToken;
    }
  } catch {
    // ignore
  }
  return null;
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
