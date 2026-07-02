import { getStoredToken } from './authSession';
import { getClientRoleFromToken } from './jwtClaims';

/**
 * Resolves the active FE role for routing from the JWT access token.
 */
export function getActiveRole(): string | undefined {
  const fromToken = getClientRoleFromToken(getStoredToken());
  if (fromToken) return fromToken;
  return localStorage.getItem('nv-user-role') || undefined;
}
