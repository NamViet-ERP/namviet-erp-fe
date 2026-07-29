import { test, expect } from '@playwright/test';

const voucherLists = [
  {
    path: '/warehouse/import',
    tabs: ['Tất cả', 'Nháp', 'Nhập dự kiến', 'Nhập thực tế'],
    searchPlaceholder: 'Tìm mã chứng từ, NCC, kho dự án...',
  },
  {
    path: '/warehouse/export',
    tabs: ['Tất cả', 'Nháp', 'Xuất dự kiến', 'Xuất thực tế'],
    searchPlaceholder: 'Tìm mã chứng từ, kho dự án...',
  },
  {
    path: '/warehouse/transfer',
    tabs: ['Tất cả', 'Nháp', 'Chuyển dự kiến', 'Chuyển thực tế'],
    searchPlaceholder: 'Tìm mã chứng từ, kho dự án...',
  },
  {
    path: '/warehouse/material-return',
    tabs: ['Tất cả', 'Nháp', 'Hoàn trả dự kiến', 'Hoàn trả thực tế'],
    searchPlaceholder: 'Tìm mã HT, phiếu xuất, kho dự án...',
  },
];

test.describe('WMS list filters', () => {
  for (const list of voucherLists) {
    test(`${list.path} status tabs are visible`, async ({ page }) => {
      await page.goto(list.path);
      for (const tab of list.tabs) {
        await expect(page.getByRole('button', { name: new RegExp(`^${tab}`) })).toBeVisible();
      }
    });

    test(`${list.path} search and date filter`, async ({ page }) => {
      await page.goto(list.path);
      await expect(page.getByPlaceholder(list.searchPlaceholder)).toBeVisible();
      await expect(page.getByText('Từ ngày', { exact: true })).toBeVisible();
      await expect(page.getByText('Đến ngày', { exact: true })).toBeVisible();
    });
  }

  test('stocktake tabs and search', async ({ page }) => {
    await page.goto('/stocktake/list');
    for (const tab of ['Tất cả', 'Đã duyệt', 'Chưa duyệt', 'Đã hủy']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${tab}`) })).toBeVisible();
    }
    await expect(page.getByPlaceholder('Tìm mã phiếu, kho dự án...')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Đóng băng' })).toBeVisible();
  });

  test('import tab Nháp filters table', async ({ page }) => {
    await page.goto('/warehouse/import');
    await page.getByRole('button', { name: /^Nháp/ }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('stocktake tab Đã hủy filters table', async ({ page }) => {
    await page.goto('/stocktake/list');
    await page.getByRole('button', { name: /^Đã hủy/ }).click();
    await expect(page.locator('table')).toBeVisible();
  });
});
