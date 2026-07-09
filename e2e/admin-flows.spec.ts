import { test, expect } from '@playwright/test';
import { listAdminRoles, listAdminUsers, loginToken } from './helpers/api';
import { clickFirstInteractiveRow } from './helpers/ui';

test.describe('Admin flows', () => {
  test('admin user detail from list row', async ({ page }) => {
    const token = await loginToken();
    const { items } = await listAdminUsers(token);
    test.skip(items.length === 0, 'No admin users');

    const target = items[0];
    await page.goto('/admin/users');
    await page.getByPlaceholder('Tìm theo tên, mã NV, email...').fill(target.fullName);
    await clickFirstInteractiveRow(page);
    await expect(page).toHaveURL(new RegExp(`/admin/users/${target.id}`));
    await expect(page.getByRole('heading', { level: 1, name: target.fullName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tài khoản hệ thống' })).toBeVisible();
  });

  test('role permissions matrix from settings', async ({ page }) => {
    const token = await loginToken();
    const roles = await listAdminRoles(token);
    test.skip(roles.length === 0, 'No roles');

    const role = roles[0];
    await page.goto('/admin/settings');
    const card = page.locator('.hrm-recruitment-position-card').filter({ hasText: role.label });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Ma trận quyền' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/settings/roles/${role.code}/permissions`));
    await expect(page.getByRole('heading', { level: 1, name: role.label })).toBeVisible();
    await expect(page.getByText(/quyền đang bật/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
  });
});
