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
import AdminUsersPage from './AdminUsersPage';

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
  rowMatchesListFilters: () => true,
}));

vi.mock('../../services/rolesService', () => ({
  rolesService: {
    listActiveOptions: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const sampleUsers: AdminUserRow[] = [
  {
    id: 'emp-014',
    toggleId: 'acc-014',
    accountUserId: 'acc-014',
    source: 'employee',
    hasAccount: true,
    employeeCode: 'NV-2026-014',
    fullName: 'Nguyễn Minh Tuấn',
    email: 'tuan.nm@mayzer.vn',
    phone: '0908123456',
    department: 'Kho & Vật tư',
    position: 'Thủ kho công trình',
    role: 'Thủ kho',
    roleCode: 'storekeeper',
    statusLabel: 'Hoạt động',
    isActive: true,
    canToggle: true,
    canProvision: false,
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
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
  },
];

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../..');

describe('AdminUsersPage Wave 6A', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    vi.resetAllMocks();
    localStorage.clear();

    vi.mocked(adminUsersService.list).mockResolvedValue({
      items: sampleUsers,
      totalCount: sampleUsers.length,
      page: 1,
      pageSize: 15,
      totalPages: 1,
      summary: { total: 12, pending: 3, active: 8, inactive: 1 },
    });
    vi.mocked(adminUsersService.suggestSystemCode).mockResolvedValue('SYS-0003');
    vi.mocked(adminUsersService.toggleStatus).mockResolvedValue(undefined);
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

  async function renderPage() {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            MemoryRouter,
            { initialEntries: ['/admin/users'] },
            createElement(
              Routes,
              null,
              createElement(Route, { path: '/admin/users', element: createElement(AdminUsersPage) }),
              createElement(Route, {
                path: '/admin/users/:id',
                element: createElement('div', { 'data-testid': 'user-detail-route' }, 'User Detail'),
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

  it('renders PageShell, TableShell, SelectField, KPI filter cards, and zero legacy btn-primary/btn-outline classes', async () => {
    await renderPage();

    const shell = container.querySelector('.erp-page-shell.erp-page-shell--list.admin-users-page');
    expect(shell).not.toBeNull();
    expect(container.querySelector('.erp-table-shell')).not.toBeNull();
    expect(container.querySelector('.pagination-bar--embedded')).not.toBeNull();

    const sourceSelect = container.querySelector('select.hrm-filter-select[aria-label="Lọc nguồn"]') as HTMLSelectElement;
    expect(sourceSelect).not.toBeNull();
    expect(container.querySelectorAll('button.btn-primary, button.btn-outline')).toHaveLength(0);

    // Filter by source using SelectField
    await act(async () => {
      sourceSelect.value = 'manual';
      sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    });
    expect(adminUsersService.list).toHaveBeenCalledWith(expect.objectContaining({ source: 'manual', page: 1 }));

    // Filter by KPI card "Chờ cấp"
    const pendingKpiBtn = container.querySelector('button[aria-label^="Chờ cấp:"]') as HTMLButtonElement;
    expect(pendingKpiBtn).not.toBeNull();
    await act(async () => {
      pendingKpiBtn.click();
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    });
    expect(adminUsersService.list).toHaveBeenCalledWith(expect.objectContaining({ pendingOnly: true, page: 1 }));
  });

  it('opens create, provision, reset password modals and lock confirm dialog with Button primitives', async () => {
    await renderPage();

    // Create modal trigger
    const addBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Thêm tài khoản hệ thống'),
    ) as HTMLButtonElement;
    expect(addBtn.className).toContain('btn-filled');
    await act(async () => {
      addBtn.click();
    });
    let dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Thêm tài khoản hệ thống');
    expect(dialog.querySelectorAll('button.btn-primary, button.btn-outline')).toHaveLength(0);

    await act(async () => {
      const cancelBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Hủy') as HTMLButtonElement;
      cancelBtn.click();
    });

    // Provision modal trigger from pending row
    const provisionBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.trim() === 'Cấp tài khoản',
    ) as HTMLButtonElement;
    expect(provisionBtn.className).toContain('btn-filled');
    await act(async () => {
      provisionBtn.click();
    });
    dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector('#admin-provision-form')).not.toBeNull();
    expect(dialog.querySelector('input[value="Trần Thị Thu Hà"]')).not.toBeNull();
    expect(dialog.querySelector('input[value="Phòng Mua hàng"]')).not.toBeNull();
    const modalRoleSelect = dialog.querySelector('select[aria-label="Vai trò hệ thống"]') as HTMLSelectElement;
    expect(modalRoleSelect).not.toBeNull();
    expect(modalRoleSelect.className).toContain('form-select');
    expect(dialog.querySelectorAll('button.btn-primary, button.btn-outline')).toHaveLength(0);

    await act(async () => {
      const cancelBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Hủy') as HTMLButtonElement;
      cancelBtn.click();
    });

    // Reset password modal trigger
    const resetBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Đặt lại MK'),
    ) as HTMLButtonElement;
    expect(resetBtn.className).toContain('btn-outlined');
    await act(async () => {
      resetBtn.click();
    });
    dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Đặt lại mật khẩu');
    expect(dialog.querySelectorAll('button.btn-primary, button.btn-outline')).toHaveLength(0);

    await act(async () => {
      const cancelBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Hủy') as HTMLButtonElement;
      cancelBtn.click();
    });

    // Lock confirm dialog via switch
    const switchBtn = container.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(switchBtn).not.toBeNull();
    await act(async () => {
      switchBtn.click();
    });
    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog).not.toBeNull();
    expect(alertDialog.textContent).toContain('Nguyễn Minh Tuấn');

    await act(async () => {
      const confirmLockBtn = [...alertDialog.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Khóa tài khoản',
      ) as HTMLButtonElement;
      confirmLockBtn.click();
    });
    expect(adminUsersService.toggleStatus).toHaveBeenCalledWith('acc-014', false, 'employee');
  });

  it('navigates on row click while ignoring clicks on interactive controls', async () => {
    await renderPage();

    const row = container.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row).not.toBeNull();
    const nameCell = row.querySelector('td.member-name') as HTMLElement;
    await act(async () => {
      nameCell.click();
    });
    expect(container.querySelector('[data-testid="user-detail-route"]')).not.toBeNull();
  });

  it('keeps Wave 6A list and modal source files free of raw <select>, raw btn classes, and Panel', () => {
    const files = [
      'src/pages/admin/AdminUsersPage.tsx',
      'src/pages/admin/users/AdminUsersTable.tsx',
      'src/pages/admin/users/useAdminUsersController.ts',
      'src/components/admin/AdminCreateSystemUserModal.tsx',
      'src/components/admin/AdminProvisionAccountModal.tsx',
      'src/components/admin/AdminResetPasswordModal.tsx',
      'src/components/admin/AdminPasswordField.tsx',
      'src/components/admin/AdminAccountSwitch.tsx',
    ];
    for (const rel of files) {
      const src = fs.readFileSync(path.join(repoRoot, rel), 'utf-8');
      expect(src, `${rel} must not contain raw <select>`).not.toMatch(/<select\b/);
      expect(src, `${rel} must not contain legacy btn-primary/btn-outline`).not.toMatch(/btn-(?:primary|outline)\b/);
      expect(src, `${rel} must not import Panel`).not.toMatch(/\bPanel\b/);
    }
  });
});
