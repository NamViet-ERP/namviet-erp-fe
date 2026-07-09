import { test, expect } from '@playwright/test';

const wmsPages: Array<{ path: string; title: string | RegExp }> = [
  { path: '/warehouse/dashboard-warehouse', title: 'Tổng quan kho hàng' },
  { path: '/warehouse/projects', title: 'Kho dự án' },
  { path: '/warehouse/stock', title: 'Tồn kho' },
  { path: '/warehouse/import', title: 'Nhập kho' },
  { path: '/warehouse/export', title: 'Xuất kho' },
  { path: '/warehouse/transfer', title: 'Chuyển kho' },
  { path: '/warehouse/material-return', title: 'Hoàn trả vật tư' },
  { path: '/warehouse/materials', title: 'Danh mục vật tư' },
  { path: '/warehouse/reports', title: 'Báo cáo kho' },
  { path: '/warehouse/settings/material-categories', title: 'Cây vật tư' },
  { path: '/warehouse/settings/material-units', title: 'Đơn vị tính' },
  { path: '/warehouse/settings/suppliers', title: 'Danh mục NCC' },
  { path: '/warehouse/settings/price-books', title: 'Bảng giá NCC' },
  { path: '/stocktake/list', title: /KIỂM KÊ KHO DỰ ÁN/i },
];

test.describe('WMS pages', () => {
  for (const { path, title } of wmsPages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }

  test('dashboard shows KPI cards', async ({ page }) => {
    await page.goto('/warehouse/dashboard-warehouse');
    await expect(page.getByText('Tổng tồn kho')).toBeVisible();
    await expect(page.getByText('Tổng giá trị')).toBeVisible();
    await expect(page.getByText('Kho dự án hoạt động')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Xu hướng Nhập / Xuất' })).toBeVisible();
  });

  test('stock matrix table renders', async ({ page }) => {
    await page.goto('/warehouse/stock');
    await expect(page.getByRole('columnheader', { name: 'Mã VT' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tên vật tư' })).toBeVisible();
  });
});
