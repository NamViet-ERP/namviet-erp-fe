import { describe, it, expect } from 'vitest';
import { getClientRoleFromToken, getIdentityRolesFromToken, toClientRole } from './jwtClaims';

/** Minimal JWT payload helper for tests (unsigned). */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe('jwtClaims', () => {
  it('maps identity Admin role to client admin', () => {
    expect(toClientRole('Admin')).toBe('admin');
    expect(toClientRole('Warehouse_Keeper')).toBe('storekeeper');
  });

  it('reads role claim from JWT payload', () => {
    const token = fakeJwt({ role: 'Admin' });
    expect(getIdentityRolesFromToken(token)).toEqual(['Admin']);
    expect(getClientRoleFromToken(token)).toBe('admin');
  });

  it('reads long-form role claim URI', () => {
    const token = fakeJwt({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'HR',
    });
    expect(getClientRoleFromToken(token)).toBe('hr');
  });

  it('returns undefined for invalid token', () => {
    expect(getClientRoleFromToken('not-a-jwt')).toBeUndefined();
    expect(getClientRoleFromToken(null)).toBeUndefined();
  });
});
