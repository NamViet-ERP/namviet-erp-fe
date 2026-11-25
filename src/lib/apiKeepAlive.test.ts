import { afterEach, describe, expect, it, vi } from 'vitest';
import { startApiKeepAlive } from './apiKeepAlive';

describe('startApiKeepAlive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts interval and visibilitychange listener only once across repeated calls', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockReturnValue(
      123 as unknown as ReturnType<typeof window.setInterval>,
    );
    const addEventSpy = vi.spyOn(document, 'addEventListener');

    startApiKeepAlive();
    startApiKeepAlive();
    startApiKeepAlive();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/health', { cache: 'no-store', credentials: 'omit' });
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(addEventSpy).toHaveBeenCalledTimes(1);
    expect(addEventSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
