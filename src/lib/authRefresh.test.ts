import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoredToken } from './authSession';
import { AUTH_REFRESH_TIMEOUT_MS, refreshAccessToken } from './authRefresh';

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses credentials and a bounded timeout; timeout is retryable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshAccessToken()).resolves.toBe('unavailable');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.credentials).toBe('include');
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(AUTH_REFRESH_TIMEOUT_MS).toBe(10_000);
  });

  it('stores access token from refresh body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'new-access' }),
      }),
    );
    await expect(refreshAccessToken()).resolves.toBe('refreshed');
    expect(getStoredToken()).toBe('new-access');
  });

  it('reports rejected when refresh returns 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );
    await expect(refreshAccessToken()).resolves.toBe('rejected');
  });
});
