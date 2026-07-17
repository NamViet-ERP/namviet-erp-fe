import {
  getStoredRefreshToken,
  isRememberMe,
  persistTokens,
} from './authSession';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
export const AUTH_REFRESH_TIMEOUT_MS = 10_000;

export type AuthRefreshResult = 'refreshed' | 'rejected' | 'unavailable';

interface TokenPairResponse {
  token: string;
  refreshToken: string;
}

/** Refresh access token without going through apiClient (avoids 401 loop). */
export async function refreshAccessToken(): Promise<AuthRefreshResult> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return 'rejected';

  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      signal: AbortSignal.timeout(AUTH_REFRESH_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return response.status >= 500 ? 'unavailable' : 'rejected';
    }

    const data = (await response.json()) as TokenPairResponse;
    if (!data.token || !data.refreshToken) return 'rejected';

    persistTokens(data.token, data.refreshToken, isRememberMe());
    localStorage.setItem('nv-logged-in', 'true');
    return 'refreshed';
  } catch {
    return 'unavailable';
  }
}
