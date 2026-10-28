import { test, expect } from '@playwright/test';

test.describe('Admin list filters', () => {
  test('admin users search and quick filters', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByPlaceholder('Tìm theo tên, mã NV, email...')).toBeVisible();
    await expect(page.getByPlaceholder('Bộ phận')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Tóm tắt tài khoản' }).getByRole('listitem', { name: /^Tổng:/ })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Tóm tắt tài khoản' }).getByRole('listitem', { name: /^Chờ cấp:/ })).toBeVisible();
  });

  test('admin users pending filter', async ({ page }) => {
    await page.goto('/admin/users');
    const pending = page.getByRole('list', { name: 'Tóm tắt tài khoản' }).getByRole('listitem', { name: /^Chờ cấp:/ });
    await pending.click();
    await expect(pending).toHaveAttribute('aria-pressed', 'true');
  });

  test('admin users search by name', async ({ page }) => {
    await page.goto('/admin/users');
    const rows = page.locator('.hrm-table-row--interactive');
    await expect(async () => {
      expect(await rows.count()).toBeGreaterThan(0);
    }).toPass();
    const firstName = (await rows.first().locator('td').nth(1).innerText()).trim();
    await page.getByPlaceholder('Tìm theo tên, mã NV, email...').fill(firstName);
    await expect(rows.first()).toContainText(firstName);
  });
});
