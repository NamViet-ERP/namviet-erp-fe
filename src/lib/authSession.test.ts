import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthSession,
  getAccessTokenExpiryMs,
  getStoredToken,
  isAccessTokenExpired,
  setAccessToken,
  subscribeAccessToken,
} from './authSession';

describe('authSession', () => {
  beforeEach(() => {
    clearAuthSession();
  });

  afterEach(() => {
    clearAuthSession();
  });

  it('stores and retrieves access token in memory', () => {
    expect(getStoredToken()).toBeNull();
    setAccessToken('test-jwt-token');
    expect(getStoredToken()).toBe('test-jwt-token');
    setAccessToken(null);
    expect(getStoredToken()).toBeNull();
  });

  it('notifies subscribers when token changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAccessToken(listener);

    setAccessToken('first-token');
    expect(listener).toHaveBeenCalledTimes(1);

    setAccessToken('second-token');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setAccessToken('third-token');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('extracts expiration from valid JWT string', () => {
    const expSec = 1750000000;
    const payload = btoa(JSON.stringify({ exp: expSec, sub: 'user-1' }));
    const jwt = `header.${payload}.signature`;

    expect(getAccessTokenExpiryMs(jwt)).toBe(expSec * 1000);
  });

  it('handles invalid or non-JWT tokens gracefully', () => {
    expect(getAccessTokenExpiryMs('')).toBeNull();
    expect(getAccessTokenExpiryMs('invalid-token')).toBeNull();
    expect(getAccessTokenExpiryMs('header.invalid-base64.signature')).toBeNull();
  });

  it('correctly reports isAccessTokenExpired', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredPayload = btoa(JSON.stringify({ exp: nowSec - 100 }));
    const expiredJwt = `header.${expiredPayload}.sig`;
    expect(isAccessTokenExpired(expiredJwt, 0)).toBe(true);

    const futurePayload = btoa(JSON.stringify({ exp: nowSec + 3600 }));
    const futureJwt = `header.${futurePayload}.sig`;
    expect(isAccessTokenExpired(futureJwt, 0)).toBe(false);
  });
});
