import { getAccessTokenExpiryMs, getStoredToken, isAccessTokenExpired, setAccessToken } from './authSession';

export const AUTH_REFRESH_TIMEOUT_MS = 30_000;

export type AuthRefreshResult = 'refreshed' | 'rejected' | 'unavailable';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function refreshUrl(): string {
  const path = '/api/auth/refresh';
  if (!BASE_URL.trim()) return path;
  return `${BASE_URL.replace(/\/$/, '')}${path}`;
}

interface TokenPairResponse {
  accessToken?: string;
  token?: string;
}

/** Coalesce concurrent refresh calls in same tab — rotation is single-use; a losing race clears the new cookie. */
let refreshInFlight: Promise<AuthRefreshResult> | null = null;

async function refreshAccessTokenOnce(): Promise<AuthRefreshResult> {
  try {
    const response = await fetch(refreshUrl(), {
      method: 'POST',
      signal: AbortSignal.timeout(AUTH_REFRESH_TIMEOUT_MS),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: '{}',
    });

    if (!response.ok) {
      if (response.status >= 500) return 'unavailable';
      const current = getStoredToken();
      const expMs = current ? getAccessTokenExpiryMs(current) : null;
      const isStillValidJwt = expMs != null && expMs > Date.now();
      if (!isStillValidJwt) {
        setAccessToken(null);
        return 'rejected';
      }
      return 'unavailable';
    }

    const data = (await response.json().catch(() => null)) as TokenPairResponse | null;
    const access = data?.accessToken ?? data?.token;
    if (!access) {
      const current = getStoredToken();
      const expMs = current ? getAccessTokenExpiryMs(current) : null;
      const isStillValidJwt = expMs != null && expMs > Date.now();
      if (!isStillValidJwt) {
        setAccessToken(null);
        return 'rejected';
      }
      return 'unavailable';
    }

    setAccessToken(access);
    return 'refreshed';
  } catch {
    return 'unavailable';
  }
}

async function refreshAccessTokenWithLock(): Promise<AuthRefreshResult> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    try {
      return await navigator.locks.request('nv-auth-refresh', async () => {
        // While waiting for the lock, another tab may have refreshed and broadcasted the new token
        const current = getStoredToken();
        if (current && !isAccessTokenExpired(current, 2 * 60_000)) {
          return 'refreshed';
        }
        return refreshAccessTokenOnce();
      });
    } catch {
      return refreshAccessTokenOnce();
    }
  }
  return refreshAccessTokenOnce();
}

/** Refresh via HttpOnly cookie; puts new access JWT into memory with cross-tab coordination. */
export async function refreshAccessToken(): Promise<AuthRefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessTokenWithLock().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
