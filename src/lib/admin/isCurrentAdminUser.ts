import type { SystemUser } from '../../types/systemUser';
import type { AdminUserRow } from '../../services/adminUsersService';

function sameId(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

function sameEmail(a?: string, b?: string): boolean {
  const left = a?.trim().toLowerCase();
  const right = b?.trim().toLowerCase();
  if (!left || !right || right === '—') return false;
  return left === right;
}

export function isCurrentAdminUserRow(
  sessionUser: SystemUser | undefined,
  row: Pick<AdminUserRow, 'id' | 'accountUserId' | 'source' | 'email' | 'employeeCode'>,
): boolean {
  if (!sessionUser) return false;
  if (sameId(row.accountUserId, sessionUser.id)) return true;
  if (sessionUser.employeeId && row.source === 'employee' && sameId(sessionUser.employeeId, row.id)) return true;
  if (row.source === 'manual' && sameId(sessionUser.id, row.id)) return true;
  if (sessionUser.employeeCode && row.employeeCode && sessionUser.employeeCode === row.employeeCode) return true;
  if (sameEmail(sessionUser.email, row.email)) return true;
  return false;
}

export function adminUserToggleKey(user: Pick<AdminUserRow, 'toggleId' | 'source'>): string {
  return `${user.source}:${user.toggleId}`;
}
