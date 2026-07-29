import { setAccessToken } from './authSession';

export const AUTH_REFRESH_TIMEOUT_MS = 10_000;

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

/** Coalesce concurrent refresh calls — rotation is single-use; a losing race clears the new cookie. */
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
      setAccessToken(null);
      return 'rejected';
    }

    const data = (await response.json().catch(() => null)) as TokenPairResponse | null;
    const access = data?.accessToken ?? data?.token;
    if (!access) {
      setAccessToken(null);
      return 'rejected';
    }

    setAccessToken(access);
    return 'refreshed';
  } catch {
    return 'unavailable';
  }
}

/** Refresh via HttpOnly cookie; puts new access JWT into memory. */
export async function refreshAccessToken(): Promise<AuthRefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessTokenOnce().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
