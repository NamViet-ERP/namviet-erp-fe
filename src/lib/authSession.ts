export const TOKEN_KEY = 'nv-access-token';
export const REFRESH_KEY = 'nv-refresh-token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('nv-logged-in');
  localStorage.removeItem('nv-session-user');
  localStorage.removeItem('nv-user-id');
  localStorage.removeItem('nv-user-role');
}
