import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionPermissions, getSessionUser, setSessionUser } from '../constants/systemUsers';
import { setAccessToken } from '../lib/authSession';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('../lib/apiClient', () => {
  class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly payload?: unknown,
    ) {
      super(message);
    }
  }
  return {
    ApiError,
    apiClient: { get: mocks.get, post: mocks.post },
    setAuthTokenProvider: vi.fn(),
  };
});

vi.mock('../lib/authRefresh', () => ({
  refreshAccessToken: mocks.refresh,
}));

import { ApiError } from '../lib/apiClient';
import { authService } from './authService';

function tokenWithExpiry(exp: number): string {
  return `header.${btoa(JSON.stringify({ exp }))}.signature`;
}

function cacheStaleUser() {
  setSessionUser({
    id: 'user-1',
    username: 'tester',
    role: 'staff',
    name: 'Tester',
    initials: 'T',
    roleLabel: 'Nhân viên',
    email: 'tester@example.com',
    permissions: ['admin.users.view:all'],
    createdAt: '2026-01-01',
  });
}

describe('authService hybrid cookie + memory access', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setAccessToken(null);
    mocks.get.mockReset();
    mocks.post.mockReset();
    mocks.refresh.mockReset();
  });

  it('does not retain cached permissions when /auth/me is unavailable', async () => {
    setAccessToken(tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600));
    cacheStaleUser();
    mocks.get.mockRejectedValueOnce(new TypeError('Network unavailable'));

    await expect(authService.ensureSession()).resolves.toBe('recoverable-error');
    expect(getSessionUser()).toBeUndefined();
    expect(getSessionPermissions()).toEqual([]);
  });

  it('treats server-provided empty permissions as authoritative', async () => {
    setAccessToken(tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600));
    cacheStaleUser();
    mocks.get.mockResolvedValueOnce({
      id: 'user-1',
      username: 'tester',
      role: 'staff',
      name: 'Tester',
      initials: 'T',
      roleLabel: 'Nhân viên',
      email: 'tester@example.com',
      permissions: [],
    });

    await expect(authService.ensureSession()).resolves.toBe('authenticated');
    expect(getSessionPermissions()).toEqual([]);
  });

  it('refreshes when access is missing then loads /me', async () => {
    mocks.refresh.mockResolvedValueOnce('refreshed');
    mocks.get.mockResolvedValueOnce({
      id: 'user-1',
      username: 'tester',
      role: 'staff',
      name: 'Tester',
      initials: 'T',
      roleLabel: 'Nhân viên',
      email: 'tester@example.com',
      permissions: ['wms.imports.view'],
    });

    await expect(authService.ensureSession()).resolves.toBe('authenticated');
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(getSessionPermissions()).toEqual(['wms.imports.view']);
  });

  it('returns retryable when refresh is unavailable and no access token', async () => {
    mocks.refresh.mockResolvedValueOnce('unavailable');

    await expect(authService.ensureSession()).resolves.toBe('recoverable-error');
    expect(getSessionUser()).toBeUndefined();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('retries refresh after /me 401', async () => {
    setAccessToken(tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600));
    mocks.get
      .mockRejectedValueOnce(new ApiError('expired', 401))
      .mockResolvedValueOnce({
        id: 'user-1',
        username: 'tester',
        role: 'staff',
        name: 'Tester',
        initials: 'T',
        roleLabel: 'Nhân viên',
        email: 'tester@example.com',
        permissions: ['wms.imports.view'],
      });
    mocks.refresh.mockResolvedValueOnce('refreshed');

    await expect(authService.ensureSession()).resolves.toBe('authenticated');
    expect(getSessionPermissions()).toEqual(['wms.imports.view']);
  });
});
