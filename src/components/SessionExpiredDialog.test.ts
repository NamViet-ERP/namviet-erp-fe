import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SessionExpiredDialog from './SessionExpiredDialog';
import { authService } from '../services/authService';
import {
  isSessionExpired,
  notifySessionExpired,
  resolveSessionExpired,
} from '../lib/sessionExpiry';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../constants/systemUsers', () => ({
  getSessionUser: () => ({ username: 'admin@mayzer.vn' }),
}));

describe('SessionExpiredDialog', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 10_000);
    resolveSessionExpired();
    vi.setSystemTime(Date.now() + 10_000);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.setSystemTime(Date.now() + 10_000);
    resolveSessionExpired();
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function renderDialog() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(SessionExpiredDialog),
        ),
      );
    });
  }

  it('cannot be dismissed by close button, backdrop click, or Escape while session is expired', async () => {
    await renderDialog();
    act(() => {
      notifySessionExpired();
    });
    expect(isSessionExpired()).toBe(true);

    expect(document.querySelector('.md-dialog__close')).toBeNull();
    const scrim = document.querySelector<HTMLElement>('.md-dialog-scrim')!;
    expect(scrim).not.toBeNull();

    await act(async () => {
      scrim.click();
    });
    expect(isSessionExpired()).toBe(true);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]')!;
    passwordInput.focus();
    await act(async () => {
      passwordInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    });
    expect(isSessionExpired()).toBe(true);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('resolves session expiry only after successful re-login submission', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({} as never);
    await renderDialog();
    act(() => {
      notifySessionExpired();
    });

    const userInput = document.querySelector<HTMLInputElement>('input[autocomplete="username"]')!;
    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]')!;

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(userInput, 'admin@mayzer.vn');
      userInput.dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(passwordInput, 'Secret@123');
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = document.getElementById('session-relogin-form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(authService.login).toHaveBeenCalledWith('admin@mayzer.vn', 'Secret@123', true);
    expect(isSessionExpired()).toBe(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
