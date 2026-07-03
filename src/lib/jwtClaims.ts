/** Maps Identity role names (JWT) to FE client role codes. */
const IDENTITY_TO_CLIENT_ROLE: Record<string, string> = {
  Admin: 'admin',
  Warehouse_Keeper: 'storekeeper',
  Accountant: 'accountant',
  Procurement: 'procurement',
  PM: 'pm',
  HR: 'hr',
  Staff: 'staff',
  Employee: 'employee',
};

const ROLE_CLAIM_KEYS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

const PERMISSION_CLAIM_KEYS = ['permission'];

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const json = atob(segment.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getIdentityRolesFromToken(token: string): string[] {
  const payload = parseJwtPayload(token);
  if (!payload) return [];

  const roles: string[] = [];
  for (const key of ROLE_CLAIM_KEYS) {
    const value = payload[key];
    if (typeof value === 'string') roles.push(value);
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') roles.push(item);
      }
    }
  }
  return roles;
}

export function toClientRole(identityRole: string): string {
  return IDENTITY_TO_CLIENT_ROLE[identityRole] ?? identityRole.toLowerCase();
}

/** Primary FE role from access token (first mapped role claim). */
export function getClientRoleFromToken(token: string | null | undefined): string | undefined {
  if (!token) return undefined;
  const roles = getIdentityRolesFromToken(token);
  if (roles.length === 0) return undefined;
  return toClientRole(roles[0]);
}

function collectClaimValues(payload: Record<string, unknown>, keys: string[]): string[] {
  const values: string[] = [];
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string') values.push(value);
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') values.push(item);
      }
    }
  }
  return values;
}

/** Permission keys embedded in the access token (`permission` claims). */
export function getPermissionsFromToken(token: string | null | undefined): string[] {
  if (!token) return [];
  const payload = parseJwtPayload(token);
  if (!payload) return [];
  return [...new Set(collectClaimValues(payload, PERMISSION_CLAIM_KEYS))];
}
