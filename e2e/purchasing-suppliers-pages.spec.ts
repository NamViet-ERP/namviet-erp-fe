import { test, expect } from '@playwright/test';

/** Smoke: purchasing + suppliers module pages (API-backed menus). */
const purchasingPages: Array<{ path: string; title: string | RegExp }> = [
  { path: '/purchasing/dashboard', title: 'Dashboard mua hàng' },
  { path: '/purchasing/plans', title: 'Kế hoạch mua hàng' },
  { path: '/purchasing/orders', title: 'Đơn hàng' },
  { path: '/purchasing/payments', title: 'Đề nghị thanh toán' },
  { path: '/purchasing/estimate-procurement', title: 'Mua hàng dự toán' },
  { path: '/purchasing/price-book', title: 'Sổ giá & Phân tích' },
  { path: '/suppliers/dashboard', title: 'Dashboard' },
  { path: '/suppliers/list', title: 'Nhà cung cấp' },
  { path: '/suppliers/groups', title: 'Nhóm nhà cung cấp' },
  { path: '/suppliers/contacts', title: 'Liên hệ NCC' },
  { path: '/suppliers/evaluations', title: 'Đánh giá NCC' },
];

test.describe('Purchasing & suppliers pages', () => {
  for (const { path, title } of purchasingPages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }
});
