/**
 * Resolves the active FE role for routing from the session user.
 */
export function getActiveRole(): string | undefined {
  return localStorage.getItem('nv-user-role') || undefined;
}
