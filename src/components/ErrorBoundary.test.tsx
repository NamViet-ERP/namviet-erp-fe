import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

const CHUNK_RELOAD_STORAGE_KEY = 'nv-chunk-reload-ts';

function Bomb({ error }: { error: Error }): never {
  throw error;
}

describe('ErrorBoundary', () => {
  let container: HTMLDivElement;
  let root: Root;
  let reloadMock: ReturnType<typeof vi.fn>;
  let originalLocationDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    sessionStorage.clear();

    reloadMock = vi.fn();
    originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        reload: reloadMock,
      },
    });

    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    sessionStorage.clear();
    if (originalLocationDescriptor) {
      Object.defineProperty(window, 'location', originalLocationDescriptor);
    }
    vi.restoreAllMocks();
  });

  it('renders fallback UI for normal UI errors without reloading the page', async () => {
    await act(async () => {
      root.render(
        createElement(
          ErrorBoundary,
          null,
          createElement(Bomb, { error: new Error('Unexpected render crash') }),
        ),
      );
    });

    expect(container.textContent).toContain('Đã xảy ra lỗi');
    expect(container.textContent).toContain('Tải lại trang');
    expect(reloadMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)).toBeNull();
  });

  it('reloads once and records timestamp in sessionStorage on first chunk-load error', async () => {
    await act(async () => {
      root.render(
        createElement(
          ErrorBoundary,
          null,
          createElement(Bomb, {
            error: new TypeError('Failed to fetch dynamically imported module: /assets/Orders-abc123.js'),
          }),
        ),
      );
    });

    expect(reloadMock).toHaveBeenCalledTimes(1);
    const savedTs = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
    expect(savedTs).not.toBeNull();
    expect(Number(savedTs)).toBeGreaterThan(0);
  });

  it('shows fallback UI instead of reloading again when chunk-load error repeats within 15s', async () => {
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(Date.now() - 2_000));

    const chunkError = new Error('Loading chunk 42 failed');
    chunkError.name = 'ChunkLoadError';

    await act(async () => {
      root.render(
        createElement(
          ErrorBoundary,
          null,
          createElement(Bomb, { error: chunkError }),
        ),
      );
    });

    expect(reloadMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Đã xảy ra lỗi');
    expect(container.textContent).toContain('Tải lại trang');
  });
});
