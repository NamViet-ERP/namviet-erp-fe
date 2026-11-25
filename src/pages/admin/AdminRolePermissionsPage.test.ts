import { act, createElement } from 'react';
import type React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rolesService } from '../../services/rolesService';
import {
  rolePermissionsService,
  type PermissionCatalogEntryApiDto,
} from '../../services/rolePermissionsService';
import AdminRolePermissionsPage from './AdminRolePermissionsPage';

vi.mock('../../services/rolesService', () => ({
  rolesService: {
    listAsync: vi.fn(),
  },
}));

vi.mock('../../services/rolePermissionsService', () => ({
  rolePermissionsService: {
    getCatalog: vi.fn(),
    getRolePermissions: vi.fn(),
    updateRolePermissions: vi.fn(),
  },
}));

vi.mock('../../auth/AuthProvider', () => ({
  useSession: () => ({
    user: { id: 'usr-admin', username: 'admin', role: 'admin' },
    permissions: ['admin.roles.view:all', 'admin.roles.permissions.update'],
    refresh: vi.fn(),
  }),
}));

vi.mock('../../components/auth/PermissionGate', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockCatalog: PermissionCatalogEntryApiDto[] = [
  { key: 'wms.materials.view:all', module: 'WMS', resource: 'Materials', label: 'Xem danh mục vật tư' },
  { key: 'wms.materials.create', module: 'WMS', resource: 'Materials', label: 'Tạo mới vật tư' },
  { key: 'purchasing.orders.view', module: 'Purchasing', resource: 'Orders', label: 'Xem đơn mua hàng' },
  { key: 'purchasing.orders.approve', module: 'Purchasing', resource: 'Orders', label: 'Duyệt đơn mua hàng' },
];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('AdminRolePermissionsPage characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();

    vi.mocked(rolesService.listAsync).mockResolvedValue([
      { code: 'procurement_staff', label: 'Nhân viên Mua hàng', isActive: true },
    ]);
    vi.mocked(rolePermissionsService.getCatalog).mockResolvedValue(mockCatalog);
    vi.mocked(rolePermissionsService.getRolePermissions).mockResolvedValue({
      roleCode: 'procurement_staff',
      permissions: ['wms.materials.view:all'],
    });
    vi.mocked(rolePermissionsService.updateRolePermissions).mockResolvedValue({
      roleCode: 'procurement_staff',
      permissions: ['wms.materials.create', 'wms.materials.view:all'],
    });

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
            { initialEntries: ['/admin/settings/roles/procurement_staff/permissions'] },
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: '/admin/settings/roles/:code/permissions',
                element: createElement(AdminRolePermissionsPage),
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

  it('displays role info, module rail, search filter, and supports toggling and saving permissions', async () => {
    await renderPage();

    // Role info & counts
    expect(container.textContent).toContain('Nhân viên Mua hàng');
    expect(container.textContent).toContain('1/4 quyền đang bật');
    expect(container.textContent).toContain('Kho');
    expect(container.textContent).toContain('Mua hàng');
    expect(container.textContent).toContain('Xem danh mục vật tư');

    // Search filter + cross module
    const searchInput = container.querySelector('input[aria-label="Tìm kiếm quyền"]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();
    const crossCheckbox = container.querySelector('.admin-role-permissions-search-cross-module input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      crossCheckbox.click();
      setInputValue(searchInput, 'đơn mua');
    });
    expect(container.textContent).toContain('Xem đơn mua hàng');
    expect(container.textContent).not.toContain('Xem danh mục vật tư');

    // Reset filters
    const resetFiltersBtn = container.querySelector('button.admin-role-permissions-reset-filter') as HTMLButtonElement;
    await act(async () => {
      resetFiltersBtn.click();
    });
    expect(container.textContent).toContain('Xem danh mục vật tư');

    // Toggle permission checkbox
    const createPermCheckbox = container.querySelector(
      'input[aria-label="Bật quyền Tạo mới vật tư"]',
    ) as HTMLInputElement;
    expect(createPermCheckbox).not.toBeNull();
    expect(createPermCheckbox.checked).toBe(false);

    await act(async () => {
      createPermCheckbox.click();
    });
    expect(createPermCheckbox.checked).toBe(true);
    expect(container.textContent).toContain('2/4 quyền đang bật · Chưa lưu');

    // Save changes
    const saveBtn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.includes('Lưu thay đổi'),
    ) as HTMLButtonElement;
    expect(saveBtn).toBeDefined();
    expect(saveBtn.disabled).toBe(false);

    await act(async () => {
      saveBtn.click();
    });

    expect(rolePermissionsService.updateRolePermissions).toHaveBeenCalledWith(
      'procurement_staff',
      ['wms.materials.create', 'wms.materials.view:all'],
    );
  });
});
