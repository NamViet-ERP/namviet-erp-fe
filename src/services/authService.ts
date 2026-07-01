import { USE_MOCK } from '../mocks';
import { apiClient, setAuthTokenProvider } from '../lib/apiClient';
import { cacheEmployeeStatus } from './employeesService';
import type { SystemUser } from '../constants/systemUsers';
import { setSessionUser } from '../constants/systemUsers';
import { getEmployeeLockReason } from '../constants/employeeStatus';
import {
  clearAuthSession as clearSession,
  getStoredToken,
  hasAuthSession,
  isAccessTokenExpired,
  persistTokens,
  setRememberMePreference,
} from '../lib/authSession';
import { refreshAccessToken } from '../lib/authRefresh';

export { clearSession as clearAuthSession, getStoredToken };

export interface AuthUserDto {
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

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUserDto;
}

function mapAuthUser(dto: AuthUserDto): SystemUser {
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
  async login(username: string, password: string, rememberMe = false): Promise<SystemUser> {
    const res = await apiClient.post<LoginResponse>('/api/auth/login', {
      username,
      password,
      rememberMe,
    });
    const lockReason = lockReasonFromStatus(res.user.employeeStatus);
    if (lockReason) throw new Error(lockReason);

    persistTokens(res.token, res.refreshToken, rememberMe);
    setRememberMePreference(rememberMe, rememberMe ? username.trim() : undefined);
    localStorage.setItem('nv-logged-in', 'true');

    if (res.user.employeeId && res.user.employeeStatus) {
      cacheEmployeeStatus(res.user.employeeId, res.user.employeeStatus);
    }

    const user = mapAuthUser(res.user);
    setSessionUser(user);
    return user;
  },

  async ensureSession(): Promise<boolean> {
    if (USE_MOCK) return localStorage.getItem('nv-logged-in') === 'true';
    if (!hasAuthSession()) return false;

    const token = getStoredToken();
    if (token && !isAccessTokenExpired(token)) return true;

    return refreshAccessToken();
  },

  async refreshSession(): Promise<boolean> {
    if (USE_MOCK) return true;
    return refreshAccessToken();
  },

  logout(): void {
    clearSession();
  },

  isLoggedIn(): boolean {
    if (USE_MOCK) return localStorage.getItem('nv-logged-in') === 'true';
    return hasAuthSession();
  },
};
