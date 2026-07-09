import { test, expect } from '@playwright/test';

const adminPages: Array<{ path: string; title: string }> = [
  { path: '/admin/users', title: 'Quản lý tài khoản người dùng' },
  { path: '/admin/settings', title: 'Thiết lập vai trò' },
];

test.describe('Admin pages', () => {
  for (const { path, title } of adminPages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }

  test('admin users page shows create action', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('button', { name: 'Thêm tài khoản hệ thống' })).toBeVisible();
  });

  test('admin settings shows role management', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: 'Danh sách vai trò' })).toBeVisible();
    await expect(page.getByPlaceholder('Tên vai trò (VD: Trưởng phòng Kho)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thêm' })).toBeVisible();
  });
});
