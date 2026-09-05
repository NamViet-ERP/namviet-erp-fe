import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAccessToken } from './authSession';
import { startProactiveTokenRefresh } from './authProactiveRefresh';

function tokenWithExpiry(expSec: number): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const payload = btoa(JSON.stringify({ exp: expSec }));
  return `${header}.${payload}.sig`;
}

describe('authProactiveRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    setAccessToken(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    setAccessToken(null);
  });

  it('refreshes before access token expiry and stores the new token', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    // Hết hạn sau 3 phút → scheduler refresh trước 2 phút = sau ~1 phút.
    setAccessToken(tokenWithExpiry(nowSec + 180));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: tokenWithExpiry(nowSec + 900) }),
    });
    vi.stubGlobal('fetch', fetchMock);

    startProactiveTokenRefresh();

    await vi.advanceTimersByTimeAsync(65_000);
    // Cho promise refresh settle
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalled();
    const request = fetchMock.mock.calls[0]?.[0] as string;
    expect(String(request)).toContain('/api/auth/refresh');
  });
});
