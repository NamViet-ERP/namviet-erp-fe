import {
  getStoredRefreshToken,
  isRememberMe,
  persistTokens,
} from './authSession';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface TokenPairResponse {
  token: string;
  refreshToken: string;
}

/** Refresh access token without going through apiClient (avoids 401 loop). */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as TokenPairResponse;
    if (!data.token || !data.refreshToken) return false;

    persistTokens(data.token, data.refreshToken, isRememberMe());
    localStorage.setItem('nv-logged-in', 'true');
    return true;
  } catch {
    return false;
  }
}
