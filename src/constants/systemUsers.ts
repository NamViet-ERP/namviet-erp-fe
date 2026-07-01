import { isAccountActiveForEmployee } from '../services/employeesService';
import { rolesService } from '../services/rolesService';
import { USE_MOCK } from '../mocks';
import { isActiveEmployee, type Employee } from '../types/hr';
import type { CreateSystemUserDto, SystemUser, SystemUserRole } from '../types/systemUser';

export type { CreateSystemUserDto, SystemUser, SystemUserRole };

const SESSION_USER_KEY = 'nv-session-user';
const USER_PASSWORD_PREFIX = 'nv-user-password-';
const ACCOUNT_ENABLED_PREFIX = 'nv-user-enabled-';

type SystemUsersMockModule = typeof import('../mocks/services/systemUsersMockStore');

let mockStoreModule: SystemUsersMockModule | null = null;

async function loadMockStoreModule(): Promise<SystemUsersMockModule> {
  mockStoreModule ??= await import('../mocks/services/systemUsersMockStore');
  return mockStoreModule;
}

/** Gọi trước render app khi `VITE_USE_MOCK=true` để nạp seed user qua dynamic import. */
export async function initSystemUsersMock(): Promise<void> {
  if (!USE_MOCK) return;
  const module = await loadMockStoreModule();
  await module.loadSystemUsersMockStore();
}

function readSystemUsersStore(): SystemUser[] {
  if (!USE_MOCK) return [];
  return mockStoreModule?.getLoadedSystemUsersMockStore()?.readStore() ?? [];
}

function writeSystemUsersStore(users: SystemUser[]): void {
  mockStoreModule?.getLoadedSystemUsersMockStore()?.writeStore(users);
}

export function setUserPassword(userId: string, password: string): void {
  localStorage.setItem(`${USER_PASSWORD_PREFIX}${userId}`, password);
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
  if (!USE_MOCK) throw new Error('createSystemUser chỉ dùng trong chế độ mock.');
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

export function isAccountManuallyEnabled(id: string): boolean {
  const raw = localStorage.getItem(`${ACCOUNT_ENABLED_PREFIX}${id}`);
  if (raw === null) return true;
  return raw !== 'false';
}

export function setAccountEnabled(id: string, enabled: boolean): void {
  localStorage.setItem(`${ACCOUNT_ENABLED_PREFIX}${id}`, enabled ? 'true' : 'false');
}

export function isUserAccountActive(user: SystemUser): boolean {
  const enableKey = user.employeeId ?? user.id;
  if (!isAccountManuallyEnabled(enableKey)) return false;
  return isAccountActiveForEmployee(user.employeeId);
}

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
