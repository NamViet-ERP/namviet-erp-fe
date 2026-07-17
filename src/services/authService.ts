import { ApiError, apiClient, setAuthTokenProvider } from '../lib/apiClient';
import { cacheEmployeeStatus } from './employeesService';
import type { SystemUser } from '../constants/systemUsers';
import { setSessionUser, clearSessionUser } from '../constants/systemUsers';
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
  if (dto.permissions !== undefined) return [...dto.permissions];
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

export type SessionCheckResult = 'authenticated' | 'unauthenticated' | 'recoverable-error';

async function syncSessionUserFromApi(): Promise<SessionCheckResult> {
  try {
    const dto = await apiClient.get<AuthUserDto>('/api/auth/me');
    const lockReason = lockReasonFromStatus(dto.employeeStatus);
    if (lockReason) {
      clearSession();
      clearSessionUser();
      return 'unauthenticated';
    }

    if (dto.employeeId && dto.employeeStatus) {
      cacheEmployeeStatus(dto.employeeId, dto.employeeStatus);
    }

    let token = getStoredToken();
    const apiPermissions = dto.permissions ?? [];
    const tokenPermissions = getPermissionsFromToken(token);
    const permissionsOutOfSync = apiPermissions.some(p => !tokenPermissions.includes(p));
    if (permissionsOutOfSync) {
      const refreshResult = await refreshAccessToken();
      if (refreshResult === 'refreshed') token = getStoredToken();
    }

    const permissions = resolvePermissions(dto, token);
    setSessionUser(mapAuthUser(dto, permissions));
    return 'authenticated';
  } catch (error) {
    clearSessionUser();
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearSession();
      return 'unauthenticated';
    }
    return 'recoverable-error';
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

  async ensureSession(): Promise<SessionCheckResult> {
    clearSessionUser();
    if (!hasAuthSession()) return 'unauthenticated';

    const token = getStoredToken();
    if (token && !isAccessTokenExpired(token)) {
      return syncSessionUserFromApi();
    }

    const refreshResult = await refreshAccessToken();
    if (refreshResult === 'unavailable') {
      clearSessionUser();
      return 'recoverable-error';
    }
    if (refreshResult === 'rejected') {
      clearSession();
      clearSessionUser();
      return 'unauthenticated';
    }

    return syncSessionUserFromApi();
  },

  async refreshSession(): Promise<SessionCheckResult> {
    const refreshResult = await refreshAccessToken();
    if (refreshResult === 'unavailable') {
      clearSessionUser();
      return 'recoverable-error';
    }
    if (refreshResult === 'rejected') {
      clearSession();
      clearSessionUser();
      return 'unauthenticated';
    }
    return syncSessionUserFromApi();
  },

  logout(): void {
    clearSession();
    clearSessionUser();
  },

  isLoggedIn(): boolean {
    return hasAuthSession();
  },
};
