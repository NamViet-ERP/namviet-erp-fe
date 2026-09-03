import { test, expect } from '@playwright/test';

const recruitmentPages: Array<{ path: string; title: string | RegExp }> = [
  { path: '/recruitment/dashboard', title: 'Dashboard tổng quan' },
  { path: '/recruitment/plans', title: 'Kế hoạch & Tiến độ lấp đầy' },
  { path: '/recruitment/costs', title: 'Quản lý chi phí & Ngân sách' },
  { path: '/recruitment/candidates', title: 'Hồ sơ ứng viên' },
  { path: '/recruitment/calendar', title: 'Lịch phỏng vấn' },
  { path: '/recruitment/reports', title: 'Báo cáo tuyển dụng' },
  { path: '/recruitment/hr-stats', title: 'Thống kê nhân sự' },
  { path: '/recruitment/settings', title: 'Tuyển dụng' },
];

test.describe('Recruitment pages', () => {
  for (const { path, title } of recruitmentPages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }

  test('candidates list has add button', async ({ page }) => {
    await page.goto('/recruitment/candidates');
    await expect(page.getByRole('button', { name: 'Thêm CV mới' })).toBeVisible();
  });

  test('calendar has schedule button', async ({ page }) => {
    await page.goto('/recruitment/calendar');
    await expect(page.getByRole('button', { name: 'Đặt lịch mới' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hôm nay' })).toBeVisible();
  });
});
