import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../../services/authService';
import LoginPage from './LoginPage';

vi.mock('../../services/authService', () => ({
  authService: {
    ensureSession: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock('../../lib/getActiveRole', () => ({
  getActiveRole: vi.fn(() => 'storekeeper'),
}));

vi.mock('../../utils/getDefaultRoute', () => ({
  getDefaultRoute: vi.fn(() => '/warehouse/dashboard'),
}));

vi.mock('../../constants/sidebarMenus', () => ({
  HRM_MODULE_ENABLED: true,
}));

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('LoginPage characterization', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();

    vi.mocked(authService.ensureSession).mockResolvedValue('unauthenticated');
    vi.mocked(authService.login).mockResolvedValue({
      id: 'usr-014',
      username: 'tuan.nm@mayzer.vn',
      role: 'storekeeper',
      name: 'Nguyễn Minh Tuấn',
      initials: 'NT',
      roleLabel: 'Thủ kho',
      email: 'tuan.nm@mayzer.vn',
      createdAt: '2026-02-10',
    });

    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  async function renderPage(initialEntry = '/login') {
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: [initialEntry] },
          createElement(
            Routes,
            null,
            createElement(Route, { path: '/login', element: createElement(LoginPage) }),
            createElement(Route, {
              path: '/warehouse/dashboard',
              element: createElement('div', { 'data-testid': 'wms-home' }, 'WMS Dashboard'),
            }),
            createElement(Route, {
              path: '/recruitment/apply',
              element: createElement('div', { 'data-testid': 'apply-route' }, 'Ứng tuyển'),
            }),
          ),
        ),
      );
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    });
  }

  it('shows validation message when submitting empty email or password', async () => {
    await renderPage();

    const form = container.querySelector('form') as HTMLFormElement;
    expect(form).not.toBeNull();

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Vui lòng điền đầy đủ email và mật khẩu',
    );
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('submits credentials, verifies session, and navigates to default route', async () => {
    await renderPage();

    vi.mocked(authService.ensureSession).mockResolvedValue('authenticated');

    const emailInput = container.querySelector('#login-email') as HTMLInputElement;
    const passwordInput = container.querySelector('#login-password') as HTMLInputElement;
    const form = container.querySelector('form') as HTMLFormElement;

    await act(async () => {
      setInputValue(emailInput, 'tuan.nm@mayzer.vn');
      setInputValue(passwordInput, 'Mayzer@2026');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(authService.login).toHaveBeenCalledWith('tuan.nm@mayzer.vn', 'Mayzer@2026', false);
    expect(container.querySelector('[data-testid="wms-home"]')).not.toBeNull();
  });

  it('renders single h1 landmark and Button primitives without raw btn-primary', async () => {
    await renderPage();

    const headings = container.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toContain('Mayzer ERP');

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();
    expect(submitBtn.className).toContain('btn-filled');
    expect(submitBtn.className).not.toContain('btn-primary');

    const applyBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Nộp đơn ứng tuyển'),
    ) as HTMLButtonElement;
    expect(applyBtn).toBeDefined();
    expect(applyBtn.className).toContain('btn-outlined');
  });
});
