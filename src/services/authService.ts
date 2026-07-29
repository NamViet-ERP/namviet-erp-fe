import { ApiError, apiClient, setAuthTokenProvider } from '../lib/apiClient';
import { cacheEmployeeStatus } from './employeesService';
import type { SystemUser } from '../constants/systemUsers';
import { setSessionUser, clearSessionUser, getSessionUser } from '../constants/systemUsers';
import { getEmployeeLockReason } from '../constants/employeeStatus';
import {
  clearAuthSession as clearSession,
  getStoredToken,
  setAccessToken,
  isAccessTokenExpired,
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
  permissions?: string[];
}

interface LoginResponse {
  user: AuthUserDto;
  accessToken?: string;
  token?: string;
}

function resolvePermissions(dto: AuthUserDto): string[] {
  return dto.permissions !== undefined ? [...dto.permissions] : [];
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
      await logoutRemote();
      clearSession();
      clearSessionUser();
      return 'unauthenticated';
    }

    if (dto.employeeId && dto.employeeStatus) {
      cacheEmployeeStatus(dto.employeeId, dto.employeeStatus);
    }

    const permissions = resolvePermissions(dto);
    setSessionUser(mapAuthUser(dto, permissions));
    return 'authenticated';
  } catch (error) {
    clearSessionUser();
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return 'unauthenticated';
    }
    return 'recoverable-error';
  }
}

async function logoutRemote(): Promise<void> {
  try {
    await apiClient.post<void>('/api/auth/logout', {});
  } catch {
    // Cookie clear is best-effort when API is down.
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

    const access = res.accessToken ?? res.token;
    if (!access) throw new Error('Phản hồi đăng nhập thiếu access token.');
    setAccessToken(access);

    if (res.user.employeeId && res.user.employeeStatus) {
      cacheEmployeeStatus(res.user.employeeId, res.user.employeeStatus);
    }

    const user = mapAuthUser(res.user, resolvePermissions(res.user));
    setSessionUser(user);
    return user;
  },

  async ensureSession(): Promise<SessionCheckResult> {
    const token = getStoredToken();
    const e2e = import.meta.env.VITE_E2E === 'true';

    // Playwright persists access JWT in localStorage; refresh cookies rotate per test context.
    // Prefer /me with the bearer token before cookie refresh so E2E storageState stays usable.
    if (e2e && token && !isAccessTokenExpired(token)) {
      const synced = await syncSessionUserFromApi();
      if (synced === 'authenticated') return synced;
      if (synced === 'recoverable-error') {
        clearSessionUser();
        return synced;
      }
    }

    if (!token || isAccessTokenExpired(token)) {
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
    }

    const synced = await syncSessionUserFromApi();
    if (synced === 'authenticated' || synced === 'recoverable-error') {
      if (synced === 'recoverable-error') clearSessionUser();
      return synced;
    }

    // Access rejected — try one refresh then /me again.
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

  async logout(): Promise<void> {
    await logoutRemote();
    clearSession();
    clearSessionUser();
  },

  isLoggedIn(): boolean {
    return Boolean(getSessionUser() && getStoredToken());
  },
};
