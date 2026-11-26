import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast } from '../../components/ui/Toast';
import { rolesService, type SystemRole } from '../../services/rolesService';
import AdminSettingsPage from './AdminSettingsPage';

vi.mock('../../services/rolesService', async importOriginal => {
  const actual = await importOriginal<typeof import('../../services/rolesService')>();
  return {
    ...actual,
    rolesService: {
      listAsync: vi.fn(),
      create: vi.fn(),
      toggleStatus: vi.fn(),
      updateLabel: vi.fn(),
      remove: vi.fn(),
    },
  };
});

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const initialRoles: SystemRole[] = [
  { code: 'procurement_staff', label: 'Nhân viên Mua hàng', isActive: true },
  { code: 'storekeeper', label: 'Thủ kho công trình', isActive: true },
  { code: 'project_engineer', label: 'Kỹ sư Dự toán', isActive: false },
];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../..');

describe('AdminSettingsPage characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();

    vi.mocked(rolesService.listAsync).mockResolvedValue(initialRoles);
    vi.mocked(rolesService.create).mockResolvedValue({
      code: 'warehouse_lead',
      label: 'Trưởng phòng Kho',
      isActive: true,
    });
    vi.mocked(rolesService.updateLabel).mockResolvedValue({
      code: 'storekeeper',
      label: 'Thủ kho vật tư trung tâm',
      isActive: true,
    });
    vi.mocked(rolesService.toggleStatus).mockResolvedValue({
      code: 'storekeeper',
      label: 'Thủ kho công trình',
      isActive: false,
    });
    vi.mocked(rolesService.remove).mockResolvedValue(undefined);

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
            { initialEntries: ['/admin/settings'] },
            createElement(
              Routes,
              null,
              createElement(Route, { path: '/admin/settings', element: createElement(AdminSettingsPage) }),
              createElement(Route, {
                path: '/admin/settings/roles/:code/permissions',
                element: createElement('div', { 'data-testid': 'permissions-route' }, 'Ma trận quyền'),
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

  it('filters roles by search query and keeps operational guide copy intact', async () => {
    await renderPage();

    expect(container.textContent).toContain('Nhân viên Mua hàng');
    expect(container.textContent).toContain('Thủ kho công trình');
    expect(container.textContent).toContain('(61 quyền pilot)');

    const searchInput = container.querySelector('input[placeholder="Tìm theo tên vai trò..."]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    await act(async () => {
      setInputValue(searchInput, 'Dự toán');
    });

    expect(container.textContent).toContain('Kỹ sư Dự toán');
    expect(container.textContent).not.toContain('Thủ kho công trình');
    expect(container.textContent).toContain('Đang lọc theo "Dự toán"');
  });

  it('validates empty/duplicate names and creates a new role', async () => {
    await renderPage();

    const addInput = container.querySelector('input[placeholder="Tên vai trò (VD: Trưởng phòng Kho)"]') as HTMLInputElement;
    const addForm = addInput.closest('form') as HTMLFormElement;

    // Empty submission shows warning
    await act(async () => {
      addForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(showToast).toHaveBeenCalledWith('warning', 'Vui lòng nhập tên vai trò');
    expect(rolesService.create).not.toHaveBeenCalled();

    // Duplicate label shows warning
    await act(async () => {
      setInputValue(addInput, '  Nhân viên Mua hàng  ');
    });
    await act(async () => {
      addForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(showToast).toHaveBeenCalledWith('warning', 'Tên vai trò đã tồn tại.');
    expect(rolesService.create).not.toHaveBeenCalled();

    // Valid creation
    await act(async () => {
      setInputValue(addInput, 'Trưởng phòng Kho');
    });
    await act(async () => {
      addForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(rolesService.create).toHaveBeenCalledWith({ label: 'Trưởng phòng Kho' });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã thêm vai trò "Trưởng phòng Kho"');
  });

  it('opens edit modal, saves renamed role, and supports delete confirmation dialog', async () => {
    await renderPage();

    // Edit role
    const editBtn = container.querySelector('button[aria-label="Sửa tên vai trò Thủ kho công trình"]') as HTMLButtonElement;
    expect(editBtn).not.toBeNull();
    await act(async () => {
      editBtn.click();
    });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Sửa tên vai trò');

    const editInput = dialog.querySelector('input.form-input') as HTMLInputElement;
    expect(editInput.value).toBe('Thủ kho công trình');

    await act(async () => {
      setInputValue(editInput, 'Thủ kho vật tư trung tâm');
    });
    const saveBtn = [...dialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Lưu',
    ) as HTMLButtonElement;
    await act(async () => {
      saveBtn.click();
    });

    expect(rolesService.updateLabel).toHaveBeenCalledWith('storekeeper', {
      label: 'Thủ kho vật tư trung tâm',
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã đổi tên vai trò thành "Thủ kho vật tư trung tâm"');

    // Delete role via confirm dialog
    const deleteBtn = container.querySelector('button[aria-label="Xóa vai trò Kỹ sư Dự toán"]') as HTMLButtonElement;
    expect(deleteBtn).not.toBeNull();
    await act(async () => {
      deleteBtn.click();
    });

    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog).not.toBeNull();
    expect(alertDialog.textContent).toContain('Kỹ sư Dự toán');

    const confirmDeleteBtn = [...alertDialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Xóa vĩnh viễn',
    ) as HTMLButtonElement;
    await act(async () => {
      confirmDeleteBtn.click();
    });

    expect(rolesService.remove).toHaveBeenCalledWith('project_engineer');
    expect(showToast).toHaveBeenCalledWith('success', 'Đã xóa vai trò "Kỹ sư Dự toán"');
  });

  it('uses PageShell, Button primitives, and keeps zero rounded-xl or legacy btn classes', async () => {
    await renderPage();

    expect(container.querySelector('.erp-page-shell.erp-page-shell--list.hrm-page')).not.toBeNull();
    const addBtn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Thêm',
    ) as HTMLButtonElement;
    expect(addBtn.className).toContain('btn-filled');
    expect(addBtn.className).not.toContain('rounded-xl');
    expect(container.querySelectorAll('button.btn-primary, button.btn-outline')).toHaveLength(0);

    for (const rel of [
      'src/pages/admin/AdminSettingsPage.tsx',
      'src/pages/admin/settings/AdminRoleEditModal.tsx',
    ]) {
      const src = fs.readFileSync(path.join(repoRoot, rel), 'utf-8');
      expect(src, `${rel} must not contain rounded-xl`).not.toContain('rounded-xl');
      expect(src, `${rel} must not contain legacy btn-primary/btn-outline`).not.toMatch(/btn-(?:primary|outline)\b/);
    }
  });
});
