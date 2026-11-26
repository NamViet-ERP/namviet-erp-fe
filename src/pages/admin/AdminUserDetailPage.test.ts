import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminUsersService, type AdminUserRow } from '../../services/adminUsersService';
import { rolesService } from '../../services/rolesService';
import AdminUserDetailPage from './AdminUserDetailPage';

vi.mock('../../services/adminUsersService', () => ({
  adminUsersService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    suggestSystemCode: vi.fn(),
    provisionAccount: vi.fn(),
    resetPassword: vi.fn(),
    toggleStatus: vi.fn(),
    changeRole: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../../services/rolesService', () => ({
  rolesService: {
    listActiveOptions: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const activeManualUser: AdminUserRow = {
  id: 'sys-002',
  toggleId: 'sys-002',
  accountUserId: 'sys-002',
  source: 'manual',
  hasAccount: true,
  employeeCode: 'SYS-0002',
  fullName: 'Lê Hoàng Nam',
  email: 'nam.lh@mayzer.vn',
  phone: '',
  department: '',
  position: '',
  role: 'Thủ kho',
  roleCode: 'storekeeper',
  statusLabel: 'Hoạt động',
  isActive: true,
  canToggle: true,
  canProvision: false,
  createdAt: '2026-02-01T08:00:00Z',
};

const pendingEmployeeUser: AdminUserRow = {
  id: 'emp-021',
  toggleId: 'emp-021',
  accountUserId: undefined,
  source: 'employee',
  hasAccount: false,
  employeeCode: 'NV-2026-021',
  fullName: 'Trần Thị Thu Hà',
  email: 'ha.ttt@mayzer.vn',
  phone: '0912456789',
  department: 'Phòng Mua hàng',
  position: 'Chuyên viên mua hàng',
  role: '',
  roleCode: '',
  statusLabel: 'Chờ cấp tài khoản',
  isActive: false,
  canToggle: false,
  canProvision: true,
  createdAt: '2026-03-05T08:00:00Z',
};

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../..');

describe('AdminUserDetailPage Wave 6A', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    vi.resetAllMocks();
    localStorage.clear();

    vi.mocked(adminUsersService.getById).mockResolvedValue(activeManualUser);
    vi.mocked(adminUsersService.changeRole).mockResolvedValue({
      ...activeManualUser,
      role: 'Nhân viên Mua hàng',
      roleCode: 'procurement_staff',
    });
    vi.mocked(adminUsersService.updateProfile).mockResolvedValue({
      ...activeManualUser,
      fullName: 'Lê Hoàng Nam Updated',
      email: 'nam.le@mayzer.vn',
    });
    vi.mocked(adminUsersService.provisionAccount).mockResolvedValue({
      ...pendingEmployeeUser,
      hasAccount: true,
      canProvision: false,
      canToggle: true,
      isActive: true,
      accountUserId: 'acc-021',
      role: 'Thủ kho',
      roleCode: 'storekeeper',
      statusLabel: 'Hoạt động',
    });
    vi.mocked(adminUsersService.resetPassword).mockResolvedValue(undefined);
    vi.mocked(rolesService.listActiveOptions).mockResolvedValue([
      { value: 'storekeeper', label: 'Thủ kho' },
      { value: 'procurement_staff', label: 'Nhân viên Mua hàng' },
      { value: 'admin', label: 'Quản trị hệ thống' },
    ]);

    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  async function renderDetail(initialEntry: string) {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            MemoryRouter,
            { initialEntries: [initialEntry] },
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: '/admin/users/:id',
                element: createElement(AdminUserDetailPage),
              }),
            ),
          ),
        ),
      );
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
    });
  }

  it('renders PageShell detail layout, edits manual profile, changes role cleanly, and reuses AdminResetPasswordModal', async () => {
    await renderDetail('/admin/users/sys-002?source=manual');

    const shell = container.querySelector('.erp-page-shell.erp-page-shell--detail.admin-user-detail-page');
    expect(shell).not.toBeNull();
    expect(container.textContent).toContain('Lê Hoàng Nam');
    expect(container.querySelectorAll('button.btn-primary, button.btn-outline')).toHaveLength(0);

    // Profile edit
    const editBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.includes('Chỉnh sửa')) as HTMLButtonElement;
    await act(async () => {
      editBtn.click();
    });
    const nameInput = container.querySelector('#admin-user-edit-name') as HTMLInputElement;
    const emailInput = container.querySelector('#admin-user-edit-email') as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, 'Lê Hoàng Nam Updated');
      setInputValue(emailInput, 'NAM.LE@MAYZER.VN');
    });
    const saveProfileBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Lưu') as HTMLButtonElement;
    await act(async () => {
      saveProfileBtn.click();
    });
    expect(adminUsersService.updateProfile).toHaveBeenCalledWith({
      toggleId: 'sys-002',
      source: 'manual',
      name: 'Lê Hoàng Nam Updated',
      email: 'nam.le@mayzer.vn',
    });

    // Role change via HrmSelect without render-phase setState
    const roleTrigger = container.querySelector('[role="combobox"][aria-label="Vai trò"]') as HTMLButtonElement;
    await act(async () => {
      roleTrigger.click();
    });
    const listbox = document.body.querySelector('[role="listbox"]') as HTMLElement;
    const procurementOpt = [...listbox.querySelectorAll('[role="option"]')].find(
      o => o.textContent?.includes('Nhân viên Mua hàng'),
    ) as HTMLButtonElement;
    await act(async () => {
      procurementOpt.click();
    });
    expect(container.textContent).toContain('Chưa lưu');

    const saveRoleBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Lưu vai trò') as HTMLButtonElement;
    expect(saveRoleBtn.disabled).toBe(false);
    await act(async () => {
      saveRoleBtn.click();
    });
    expect(adminUsersService.changeRole).toHaveBeenCalledWith({
      toggleId: 'sys-002',
      source: 'manual',
      role: 'procurement_staff',
    });
    expect(container.textContent).not.toContain('Chưa lưu');

    // Reused AdminResetPasswordModal
    const resetBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.includes('Đặt lại MK')) as HTMLButtonElement;
    await act(async () => {
      resetBtn.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector('#admin-reset-password-form')).not.toBeNull();
    const pwInput = dialog.querySelector('input[type="password"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(pwInput, 'MayzerERP2026');
    });
    const submitResetBtn = [...dialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Lưu mật khẩu mới',
    ) as HTMLButtonElement;
    await act(async () => {
      submitResetBtn.click();
    });
    expect(adminUsersService.resetPassword).toHaveBeenCalledWith({
      accountUserId: 'sys-002',
      password: 'MayzerERP2026',
    });
  });

  it('reuses AdminProvisionAccountModal for pending HR employees', async () => {
    vi.mocked(adminUsersService.getById).mockResolvedValue(pendingEmployeeUser);
    await renderDetail('/admin/users/emp-021?source=employee');

    const provisionBtn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.includes('Cấp tài khoản'),
    ) as HTMLButtonElement;
    await act(async () => {
      provisionBtn.click();
    });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector('#admin-provision-form')).not.toBeNull();
    expect(dialog.querySelector('select[aria-label="Vai trò hệ thống"]')).not.toBeNull();
    expect(dialog.querySelector('input[value="Phòng Mua hàng"]')).not.toBeNull();

    const pwInput = dialog.querySelector('input[type="password"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(pwInput, 'MayzerERP2026');
    });
    const submitBtn = [...dialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Cấp tài khoản',
    ) as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });
    expect(adminUsersService.provisionAccount).toHaveBeenCalledWith({
      employeeId: 'emp-021',
      role: 'storekeeper',
      password: 'MayzerERP2026',
    });
  });

  it('keeps AdminUserDetail files free of duplicate inline modals, raw <select>, raw btn classes, and render-phase setState', () => {
    const files = [
      'src/pages/admin/AdminUserDetailPage.tsx',
      'src/pages/admin/users/AdminUserDetailBoard.tsx',
      'src/pages/admin/users/useAdminUserDetailController.ts',
    ];
    for (const rel of files) {
      const src = fs.readFileSync(path.join(repoRoot, rel), 'utf-8');
      expect(src, `${rel} must not contain raw <select>`).not.toMatch(/<select\b/);
      expect(src, `${rel} must not contain legacy btn-primary/btn-outline`).not.toMatch(/btn-(?:primary|outline)\b/);
      expect(src, `${rel} must not contain duplicate inline modals`).not.toMatch(/admin-detail-(?:provision|reset)-form/);
      expect(src, `${rel} must not contain prevRoleCode render sync`).not.toMatch(/prevRoleCode/);
    }
  });
});
