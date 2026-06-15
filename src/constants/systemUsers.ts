import { isAccountActiveForEmployee } from '../services/employeesService';
import { USE_MOCK } from '../lib/mock';

const SESSION_USER_KEY = 'nv-session-user';

export type SystemUserRole = 'admin' | 'storekeeper' | 'accountant' | 'procurement' | 'pm' | 'hr';

export interface SystemUser {
  id: string;
  username: string;
  role: SystemUserRole;
  name: string;
  initials: string;
  roleLabel: string;
  email: string;
  /** Liên kết hồ sơ nhân viên — trạng thái Nghỉ việc sẽ khóa đăng nhập */
  employeeId?: string;
}

export const systemUsers: SystemUser[] = [
  { id: 'admin', username: 'tuan.nguyen', role: 'admin', name: 'Nguyễn Minh Tuấn', initials: 'AD', roleLabel: 'Quản trị viên', email: 'tuan.nguyen@namviet.vn' },
  { id: 'storekeeper', username: 'vy.phan', role: 'storekeeper', name: 'Phan Văn Vỹ', initials: 'VV', roleLabel: 'Thủ kho (Storekeeper)', email: 'vy.phan@namviet.vn', employeeId: 'emp_1' },
  { id: 'accountant', username: 'hong.le', role: 'accountant', name: 'Lê Thị Hồng', initials: 'LH', roleLabel: 'Kế toán trưởng', email: 'hong.le@namviet.vn' },
  { id: 'procurement', username: 'chi.my', role: 'procurement', name: 'Mỹ Chi', initials: 'MC', roleLabel: 'Phòng mua hàng', email: 'chi.my@namviet.vn' },
  { id: 'pm', username: 'hung.nguyen', role: 'pm', name: 'Nguyễn Văn Hùng', initials: 'NH', roleLabel: 'Quản lý dự án (PM)', email: 'hung.nguyen@namviet.vn' },
  { id: 'hr1', username: 'lan.nguyen', role: 'hr', name: 'Nguyễn Thị Lan', initials: 'NL', roleLabel: 'Nhân sự (HR)', email: 'lan.nguyen@namviet.vn' },
  { id: 'hr2', username: 'minh.tran', role: 'hr', name: 'Trần Văn Minh', initials: 'TM', roleLabel: 'Nhân sự (HR)', email: 'minh.tran@namviet.vn' },
];

export function getHrStaff(): SystemUser[] {
  return systemUsers.filter(u => u.role === 'hr' && isAccountActiveForEmployee(u.employeeId));
}

export function canUserLogin(user: SystemUser): boolean {
  return isAccountActiveForEmployee(user.employeeId);
}

export function getLoginEligibleUsers(): SystemUser[] {
  return systemUsers.filter(canUserLogin);
}

export function getUserByRole(role: string): SystemUser | undefined {
  return systemUsers.find(u => u.role === role);
}

export function getUserById(id: string): SystemUser | undefined {
  return systemUsers.find(u => u.id === id);
}

function readStoredSessionUser(): SystemUser | undefined {
  const raw = localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as SystemUser;
    if (parsed?.id && parsed?.username && parsed?.role) return parsed;
  } catch {
    /* ignore corrupt payload */
  }
  return undefined;
}

/** Phiên đăng nhập — ưu tiên JSON từ API; mock mode fallback systemUsers. */
export function getSessionUser(): SystemUser | undefined {
  const stored = readStoredSessionUser();
  if (stored) return stored;

  if (!USE_MOCK) return undefined;

  const userId = localStorage.getItem('nv-user-id');
  if (userId) {
    const byId = getUserById(userId);
    if (byId) return byId;
  }
  const legacyRole = localStorage.getItem('nv-user-role');
  if (legacyRole) return getUserByRole(legacyRole);
  return getUserById('admin');
}

export function setSessionUser(user: SystemUser): void {
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  localStorage.setItem('nv-user-id', user.id);
  localStorage.setItem('nv-user-role', user.role);
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('nv-user-id');
  localStorage.removeItem('nv-user-role');
}

export function getUserByUsername(username: string): SystemUser | undefined {
  return systemUsers.find(u => u.username === username);
}

/** Match username, full email, or local-part before @ (vd. vy.phan ↔ vy.phan@namviet.vn). */
export function findUserByLogin(login: string): SystemUser | undefined {
  const q = login.trim().toLowerCase();
  if (!q) return undefined;
  const localPart = q.includes('@') ? q.split('@')[0] : q;
  return systemUsers.find(
    u =>
      u.username.toLowerCase() === q ||
      u.email.toLowerCase() === q ||
      u.username.toLowerCase() === localPart,
  );
}

export function getRolesMap(): Record<string, Pick<SystemUser, 'name' | 'initials' | 'roleLabel' | 'email'>> {
  return Object.fromEntries(
    systemUsers.map(u => [u.role, { name: u.name, initials: u.initials, roleLabel: u.roleLabel, email: u.email }])
  );
}
