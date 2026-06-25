import { getStoredToken } from './authSession';
import { getClientRoleFromToken } from './jwtClaims';
import { USE_MOCK } from '../mocks';

/**
 * Resolves the active FE role for routing.
 * API mode: JWT access token (not manipulable via localStorage alone).
 * Mock mode: session/localStorage fallback.
 */
export function getActiveRole(): string | undefined {
  if (!USE_MOCK) {
    const fromToken = getClientRoleFromToken(getStoredToken());
    if (fromToken) return fromToken;
  }
  return localStorage.getItem('nv-user-role') || undefined;
}
