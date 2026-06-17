import { isAccountActiveForEmployee } from '../services/employeesService';
import { rolesService } from '../services/rolesService';
import { USE_MOCK } from '../lib/mock';
import { isActiveEmployee, type Employee } from '../types/hr';

const SESSION_USER_KEY = 'nv-session-user';
const SYSTEM_USERS_STORAGE_KEY = 'nv-system-users';

/** Mã vai trò hệ thống — danh sách động từ Thiết lập Admin */
export type SystemUserRole = string;



export interface SystemUser {

  id: string;

  username: string;

  role: SystemUserRole;

  name: string;

  initials: string;

  roleLabel: string;

  email: string;

  phone?: string;

  employeeCode?: string;

  department?: string;

  position?: string;

  createdAt: string;

  /** Liên kết hồ sơ nhân viên — trạng thái Nghỉ việc sẽ khóa đăng nhập */

  employeeId?: string;

}



export interface CreateSystemUserDto {

  name: string;

  email: string;

  phone?: string;

  employeeCode?: string;

  department?: string;

  position?: string;

  role: SystemUserRole;

  username?: string;

  /** Liên kết hồ sơ nhân viên khi cấp tài khoản từ HR */
  employeeId?: string;
}

const USER_PASSWORD_PREFIX = 'nv-user-password-';

export function setUserPassword(userId: string, password: string): void {
  localStorage.setItem(`${USER_PASSWORD_PREFIX}${userId}`, password);
}

const seedSystemUsers: SystemUser[] = [

  {

    id: 'admin',

    username: 'tuan.nguyen',

    role: 'admin',

    name: 'Nguyễn Minh Tuấn',

    initials: 'AD',

    roleLabel: 'Quản trị viên',

    email: 'tuan.nguyen@namviet.vn',

    phone: '0909111222',

    employeeCode: 'NV-ADM',

    department: 'Ban Giám đốc',

    position: 'Giám đốc điều hành',

    createdAt: '2024-01-15',

  },

  {

    id: 'storekeeper',

    username: 'vy.phan',

    role: 'storekeeper',

    name: 'Phan Văn Vỹ',

    initials: 'VV',

    roleLabel: 'Thủ kho (Storekeeper)',

    email: 'vy.phan@namviet.vn',

    employeeId: 'emp_1',

    createdAt: '2024-03-01',

  },

  {

    id: 'accountant',

    username: 'hong.le',

    role: 'accountant',

    name: 'Lê Thị Hồng',

    initials: 'LH',

    roleLabel: 'Kế toán trưởng',

    email: 'hong.le@namviet.vn',

    phone: '0912345678',

    employeeCode: 'NV-0003',

    department: 'Kế toán',

    position: 'Kế toán trưởng',

    createdAt: '2024-04-10',

  },

  {

    id: 'procurement',

    username: 'chi.my',

    role: 'procurement',

    name: 'Mỹ Chi',

    initials: 'MC',

    roleLabel: 'Phòng mua hàng',

    email: 'chi.my@namviet.vn',

    phone: '0923456789',

    employeeCode: 'NV-0004',

    department: 'Mua hàng',

    position: 'Chuyên viên mua hàng',

    createdAt: '2024-05-20',

  },

  {

    id: 'pm',

    username: 'hung.nguyen',

    role: 'pm',

    name: 'Nguyễn Văn Hùng',

    initials: 'NH',

    roleLabel: 'Quản lý dự án (PM)',

    email: 'hung.nguyen@namviet.vn',

    phone: '0934567890',

    employeeCode: 'NV-0005',

    department: 'Dự án',

    position: 'Project Manager',

    createdAt: '2024-06-01',

  },

  {

    id: 'hr1',

    username: 'thuy.duong',

    role: 'hr',

    name: 'Thùy Dương',

    initials: 'TD',

    roleLabel: 'Nhân sự (HR)',

    email: 'thuy.duong@namviet.vn',

    phone: '0901000001',

    employeeCode: 'NV-0101',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-01-01',

  },

  {

    id: 'hr2',

    username: 'phuong.thao',

    role: 'hr',

    name: 'Phương Thảo',

    initials: 'PT',

    roleLabel: 'Nhân sự (HR)',

    email: 'phuong.thao@namviet.vn',

    phone: '0901000002',

    employeeCode: 'NV-0102',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-02-01',

  },

  {

    id: 'hr3',

    username: 'vinh.viet',

    role: 'hr',

    name: 'Vinh Việt',

    initials: 'VV',

    roleLabel: 'Nhân sự (HR)',

    email: 'vinh.viet@namviet.vn',

    phone: '0901000003',

    employeeCode: 'NV-0103',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-03-01',

  },

  {

    id: 'hr4',

    username: 'thuy.tien',

    role: 'hr',

    name: 'Thủy Tiên',

    initials: 'TT',

    roleLabel: 'Nhân sự (HR)',

    email: 'thuy.tien@namviet.vn',

    phone: '0901000004',

    employeeCode: 'NV-0104',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-04-01',

  },

  {

    id: 'hr5',

    username: 'kim.ngan',

    role: 'hr',

    name: 'Kim Ngân',

    initials: 'KN',

    roleLabel: 'Nhân sự (HR)',

    email: 'kim.ngan@namviet.vn',

    phone: '0901000005',

    employeeCode: 'NV-0105',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-05-01',

  },

  {

    id: 'hr6',

    username: 'kim.hue',

    role: 'hr',

    name: 'Kim Huệ',

    initials: 'KH',

    roleLabel: 'Nhân sự (HR)',

    email: 'kim.hue@namviet.vn',

    phone: '0901000006',

    employeeCode: 'NV-0106',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-06-01',

  },

  {

    id: 'hr7',

    username: 'son.ny',

    role: 'hr',

    name: 'Son Ny',

    initials: 'SN',

    roleLabel: 'Nhân sự (HR)',

    email: 'son.ny@namviet.vn',

    phone: '0901000007',

    employeeCode: 'NV-0107',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-07-01',

  },

  {

    id: 'hr8',

    username: 'thao.phat',

    role: 'hr',

    name: 'Thảo Phát',

    initials: 'TP',

    roleLabel: 'Nhân sự (HR)',

    email: 'thao.phat@namviet.vn',

    phone: '0901000008',

    employeeCode: 'NV-0108',

    department: 'Nhân sự',

    position: 'Chuyên viên HCNS',

    createdAt: '2024-08-01',

  },

];



function readSystemUsersStore(): SystemUser[] {

  try {

    const raw = localStorage.getItem(SYSTEM_USERS_STORAGE_KEY);

    if (raw) return JSON.parse(raw) as SystemUser[];

  } catch {

    /* ignore */

  }

  localStorage.setItem(SYSTEM_USERS_STORAGE_KEY, JSON.stringify(seedSystemUsers));

  return [...seedSystemUsers];

}



function writeSystemUsersStore(users: SystemUser[]): void {

  localStorage.setItem(SYSTEM_USERS_STORAGE_KEY, JSON.stringify(users));

}



export function getSystemUsers(): SystemUser[] {

  return readSystemUsersStore();

}



function makeInitials(name: string): string {

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {

    return (parts[parts.length - 1][0] + parts[0][0]).toUpperCase();

  }

  return name.slice(0, 2).toUpperCase();

}



export function createSystemUser(dto: CreateSystemUserDto): SystemUser {

  const users = readSystemUsersStore();

  const email = dto.email.trim().toLowerCase();

  const username = (dto.username?.trim() || email.split('@')[0]).toLowerCase();



  if (users.some(u => u.email.toLowerCase() === email)) {

    throw new Error('Email đã được sử dụng');

  }

  if (users.some(u => u.username.toLowerCase() === username)) {

    throw new Error('Tên đăng nhập đã tồn tại');

  }

  const roleLabel = rolesService.getActiveLabel(dto.role);

  if (!roleLabel) throw new Error('Vai trò không hợp lệ hoặc đã bị tắt');



  const created: SystemUser = {

    id: `user_${Date.now()}`,

    username,

    role: dto.role,

    name: dto.name.trim(),

    initials: makeInitials(dto.name),

    roleLabel,

    email,

    phone: dto.phone?.trim() || undefined,

    employeeCode: dto.employeeCode?.trim() || undefined,

    department: dto.department?.trim() || undefined,

    position: dto.position?.trim() || undefined,

    employeeId: dto.employeeId,

    createdAt: new Date().toISOString().slice(0, 10),

  };



  users.unshift(created);

  writeSystemUsersStore(users);

  return created;

}



const ACCOUNT_ENABLED_PREFIX = 'nv-user-enabled-';



export function isAccountManuallyEnabled(id: string): boolean {

  const raw = localStorage.getItem(`${ACCOUNT_ENABLED_PREFIX}${id}`);

  if (raw === null) return true;

  return raw !== 'false';

}



export function setAccountEnabled(id: string, enabled: boolean): void {

  localStorage.setItem(`${ACCOUNT_ENABLED_PREFIX}${id}`, enabled ? 'true' : 'false');

}



/** Bật/tắt đăng nhập theo mã nhân viên hoặc tài khoản hệ thống (không liên kết NV). */

export function isUserAccountActive(user: SystemUser): boolean {

  const enableKey = user.employeeId ?? user.id;

  if (!isAccountManuallyEnabled(enableKey)) return false;

  return isAccountActiveForEmployee(user.employeeId);

}



/** Trạng thái đăng nhập của nhân viên — dùng cho trang Quản lý người dùng. */

export function isEmployeeLoginActive(employee: Pick<Employee, 'id' | 'status'>): boolean {

  if (!isAccountManuallyEnabled(employee.id)) return false;

  return isActiveEmployee(employee);

}



export function getSystemUserByEmployeeId(employeeId: string): SystemUser | undefined {

  return getSystemUsers().find(u => u.employeeId === employeeId);

}



export function getHrStaff(): SystemUser[] {

  return getSystemUsers().filter(u => u.role === 'hr' && isAccountActiveForEmployee(u.employeeId));

}



export function canUserLogin(user: SystemUser): boolean {

  return isUserAccountActive(user);

}



export function getLoginEligibleUsers(): SystemUser[] {

  return getSystemUsers().filter(canUserLogin);

}



export function getUserByRole(role: string): SystemUser | undefined {

  return getSystemUsers().find(u => u.role === role);

}



export function getUserById(id: string): SystemUser | undefined {

  return getSystemUsers().find(u => u.id === id);

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

  return getSystemUsers().find(u => u.username === username);

}



/** Match username, full email, or local-part before @ (vd. vy.phan ↔ vy.phan@namviet.vn). */

export function findUserByLogin(login: string): SystemUser | undefined {

  const q = login.trim().toLowerCase();

  if (!q) return undefined;

  const localPart = q.includes('@') ? q.split('@')[0] : q;

  return getSystemUsers().find(

    u =>

      u.username.toLowerCase() === q ||

      u.email.toLowerCase() === q ||

      u.username.toLowerCase() === localPart,

  );

}



export function getRolesMap(): Record<string, Pick<SystemUser, 'name' | 'initials' | 'roleLabel' | 'email'>> {

  return Object.fromEntries(

    getSystemUsers().map(u => [u.role, { name: u.name, initials: u.initials, roleLabel: u.roleLabel, email: u.email }]),

  );

}


