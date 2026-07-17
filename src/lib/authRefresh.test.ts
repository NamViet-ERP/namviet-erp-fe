import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistTokens } from './authSession';
import { AUTH_REFRESH_TIMEOUT_MS, refreshAccessToken } from './authRefresh';

describe('refreshAccessToken', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses a bounded timeout and reports timeout as retryable', async () => {
    persistTokens('access-token', 'refresh-token', false);
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshAccessToken()).resolves.toBe('unavailable');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(AUTH_REFRESH_TIMEOUT_MS).toBe(10_000);
  });
});
