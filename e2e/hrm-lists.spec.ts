import { test, expect } from '@playwright/test';
import { listCandidates, loginToken } from './helpers/api';

test.describe('HRM list filters', () => {
  test('members list search and status filter', async ({ page }) => {
    await page.goto('/members/list');
    await expect(page.getByPlaceholder('Tìm theo tên, mã NV, bộ phận...')).toBeVisible();
    await expect(page.locator('.hrm-filter-select')).toBeVisible();
    await expect(page.locator('.hrm-stat-card__label', { hasText: 'Tổng' })).toBeVisible();
    await expect(page.locator('.hrm-stat-card__label', { hasText: 'Đang làm' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thêm nhân viên' })).toBeVisible();
  });

  test('members list search narrows results', async ({ page }) => {
    await page.goto('/members/list');
    const rows = page.locator('.hrm-table-row--interactive');
    await expect(async () => {
      expect(await rows.count()).toBeGreaterThan(0);
    }).toPass();

    const firstName = (
      await rows.first().locator('.member-name span[title]').getAttribute('title')
    )?.trim();
    test.skip(!firstName, 'Could not read employee name');

    await page.getByPlaceholder('Tìm theo tên, mã NV, bộ phận...').fill(firstName!);
    await expect(rows.first()).toContainText(firstName!);
    await expect(rows).toHaveCount(1);
  });

  test('candidates list filters', async ({ page }) => {
    await page.goto('/recruitment/candidates');
    await expect(page.getByRole('searchbox', { name: 'Tìm kiếm ứng viên' })).toBeVisible();
    await expect(page.getByText('Tổng hồ sơ')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Lọc trạng thái' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Lọc vị trí' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Lọc nguồn' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Lọc HR phụ trách' })).toBeVisible();
  });

  test('candidates list search', async ({ page }) => {
    const token = await loginToken();
    const { items } = await listCandidates(token);
    test.skip(items.length === 0, 'No candidates');

    const target = items[0];
    await page.goto('/recruitment/candidates');
    await page.getByRole('searchbox', { name: 'Tìm kiếm ứng viên' }).fill(target.fullName);
    await expect(page.locator('.hrm-table-row--interactive').first()).toContainText(target.fullName);
  });
});
