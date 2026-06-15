import { apiClient, setAuthTokenProvider } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import { cacheEmployeeStatus } from './employeesService';
import type { SystemUser, SystemUserRole } from '../constants/systemUsers';
import { setSessionUser, clearSessionUser } from '../constants/systemUsers';
import { getEmployeeLockReason } from '../constants/employeeStatus';

const TOKEN_KEY = 'nv-access-token';
const REFRESH_KEY = 'nv-refresh-token';

export interface FeAuthUserDto {
  id: string;
  username: string;
  role: string;
  name: string;
  initials: string;
  roleLabel: string;
  email: string;
  employeeId?: string;
  employeeStatus?: string;
}

interface FeAuthResponse {
  token: string;
  refreshToken: string;
  user: FeAuthUserDto;
}

const FE_ROLE_MAP: Record<string, SystemUserRole> = {
  admin: 'admin',
  storekeeper: 'storekeeper',
  accountant: 'accountant',
  procurement: 'procurement',
  pm: 'pm',
  hr: 'hr',
};

function mapFeUser(dto: FeAuthUserDto): SystemUser {
  const role = FE_ROLE_MAP[dto.role.toLowerCase()] ?? 'storekeeper';
  return {
    id: dto.id,
    username: dto.username,
    role,
    name: dto.name,
    initials: dto.initials,
    roleLabel: dto.roleLabel,
    email: dto.email,
    employeeId: dto.employeeId,
  };
}

function lockReasonFromStatus(status?: string): string | null {
  return getEmployeeLockReason(status);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('nv-logged-in');
  clearSessionUser();
}

export function initAuthTokenProvider(): void {
  setAuthTokenProvider(getStoredToken);
}

export const authService = {
  async loginFe(username: string, password: string): Promise<SystemUser> {
    const res = await apiClient.post<FeAuthResponse>('/api/auth/login', { username, password });
    const lockReason = lockReasonFromStatus(res.user.employeeStatus);
    if (lockReason) throw new Error(lockReason);

    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem('nv-logged-in', 'true');

    if (res.user.employeeId && res.user.employeeStatus) {
      cacheEmployeeStatus(res.user.employeeId, res.user.employeeStatus);
    }

    const user = mapFeUser(res.user);
    setSessionUser(user);
    return user;
  },

  logout(): void {
    clearAuthSession();
  },

  isLoggedIn(): boolean {
    if (USE_MOCK) return localStorage.getItem('nv-logged-in') === 'true';
    return Boolean(getStoredToken());
  },
};
