import { apiClient, setAuthTokenProvider } from '../lib/apiClient';
import { cacheEmployeeStatus } from './employeesService';
import type { SystemUser } from '../constants/systemUsers';
import { getSessionUser, setSessionUser, clearSessionUser } from '../constants/systemUsers';
import { getEmployeeLockReason } from '../constants/employeeStatus';
import {
  clearAuthSession as clearSession,
  getStoredToken,
  hasAuthSession,
  isAccessTokenExpired,
  persistTokens,
  setRememberMePreference,
} from '../lib/authSession';
import { getPermissionsFromToken } from '../lib/jwtClaims';
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
  permissions?: string[];
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUserDto;
}

function resolvePermissions(dto: AuthUserDto, token: string | null | undefined): string[] {
  const apiPermissions = dto.permissions ?? [];
  if (apiPermissions.length > 0) return [...apiPermissions];
  return getPermissionsFromToken(token);
}

function mapAuthUser(dto: AuthUserDto, permissions: string[]): SystemUser {
  return {
    id: dto.id,
    username: dto.username,
    role: dto.role.toLowerCase(),
    name: dto.name,
    initials: dto.initials,
    roleLabel: dto.roleLabel,
    email: dto.email,
    employeeId: dto.employeeId,
    permissions: [...permissions],
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

function lockReasonFromStatus(status?: string): string | null {
  return getEmployeeLockReason(status);
}

async function syncSessionUserFromApi(): Promise<void> {
  const existing = getSessionUser();
  if (!existing) return;

  try {
    const dto = await apiClient.get<AuthUserDto>('/api/auth/me');
    const lockReason = lockReasonFromStatus(dto.employeeStatus);
    if (lockReason) {
      clearSession();
      return;
    }

    if (dto.employeeId && dto.employeeStatus) {
      cacheEmployeeStatus(dto.employeeId, dto.employeeStatus);
    }

    let token = getStoredToken();
    const apiPermissions = dto.permissions ?? [];
    const tokenPermissions = getPermissionsFromToken(token);
    const permissionsOutOfSync = apiPermissions.some(p => !tokenPermissions.includes(p));
    if (permissionsOutOfSync) {
      const refreshed = await refreshAccessToken();
      if (refreshed) token = getStoredToken();
    }

    const permissions = resolvePermissions(dto, token);
    setSessionUser(mapAuthUser(dto, permissions));
  } catch {
    const tokenPermissions = getPermissionsFromToken(getStoredToken());
    if (tokenPermissions.length > 0 && existing) {
      setSessionUser({ ...existing, permissions: tokenPermissions });
    }
  }
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

    if (res.user.employeeId && res.user.employeeStatus) {
      cacheEmployeeStatus(res.user.employeeId, res.user.employeeStatus);
    }

    const user = mapAuthUser(
      res.user,
      resolvePermissions(res.user, res.token),
    );
    setSessionUser(user);
    return user;
  },

  async ensureSession(): Promise<boolean> {
    if (!hasAuthSession()) return false;

    const token = getStoredToken();
    if (token && !isAccessTokenExpired(token)) {
      await syncSessionUserFromApi();
      return true;
    }

    const refreshed = await refreshAccessToken();
    if (!refreshed) return false;

    await syncSessionUserFromApi();
    return true;
  },

  async refreshSession(): Promise<boolean> {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return false;
    await syncSessionUserFromApi();
    return true;
  },

  logout(): void {
    clearSession();
    clearSessionUser();
  },

  isLoggedIn(): boolean {
    return hasAuthSession();
  },
};
