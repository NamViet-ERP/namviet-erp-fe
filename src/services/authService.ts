import { apiClient, setAuthTokenProvider } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import { cacheEmployeeStatus } from './employeesService';
import type { SystemUser } from '../constants/systemUsers';
import { setSessionUser } from '../constants/systemUsers';
import { getEmployeeLockReason } from '../constants/employeeStatus';
import {
  clearAuthSession as clearSession,
  getStoredToken,
  REFRESH_KEY,
  TOKEN_KEY,
} from '../lib/authSession';

export { clearSession as clearAuthSession, getStoredToken };

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

function mapFeUser(dto: FeAuthUserDto): SystemUser {
  return {
    id: dto.id,
    username: dto.username,
    role: dto.role.toLowerCase(),
    name: dto.name,
    initials: dto.initials,
    roleLabel: dto.roleLabel,
    email: dto.email,
    employeeId: dto.employeeId,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

function lockReasonFromStatus(status?: string): string | null {
  return getEmployeeLockReason(status);
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
    clearSession();
  },

  isLoggedIn(): boolean {
    if (USE_MOCK) return localStorage.getItem('nv-logged-in') === 'true';
    return Boolean(getStoredToken());
  },
};
