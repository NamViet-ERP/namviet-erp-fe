import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionPermissions, getSessionUser, setSessionUser } from '../constants/systemUsers';
import { getStoredToken, persistTokens } from '../lib/authSession';

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

describe('authService fail-closed bootstrap', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mocks.get.mockReset();
    mocks.post.mockReset();
    mocks.refresh.mockReset();
  });

  it('does not retain cached permissions when /auth/me is unavailable', async () => {
    const token = tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600);
    persistTokens(token, 'refresh-token', false);
    cacheStaleUser();
    mocks.get.mockRejectedValueOnce(new TypeError('Network unavailable'));

    await expect(authService.ensureSession()).resolves.toBe('recoverable-error');
    expect(getSessionUser()).toBeUndefined();
    expect(getSessionPermissions()).toEqual([]);
    expect(getStoredToken()).toBe(token);
  });

  it('treats server-provided empty permissions as authoritative', async () => {
    persistTokens(tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600), 'refresh-token', false);
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

  it('returns a retryable state when refresh times out or is unavailable', async () => {
    const token = tokenWithExpiry(Math.floor(Date.now() / 1000) - 60);
    persistTokens(token, 'refresh-token', false);
    cacheStaleUser();
    mocks.refresh.mockResolvedValueOnce('unavailable');

    await expect(authService.ensureSession()).resolves.toBe('recoverable-error');
    expect(getSessionUser()).toBeUndefined();
    expect(getStoredToken()).toBe(token);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
