import { test, expect } from '@playwright/test';
import { getEmployee, loginToken } from './helpers/api';
import { e2eEnv } from './helpers/env';

const hrmPages: Array<{ path: string; title: string | RegExp }> = [
  { path: '/dashboard', title: 'Tổng quan Vận hành Dự án' },
  { path: '/members/list', title: 'Danh sách nhân viên' },
  { path: '/members/new', title: 'Thêm nhân viên' },
  { path: '/members/settings', title: 'Phòng ban' },
  { path: '/members/settings/branches', title: 'Chi nhánh' },
  { path: '/recruitment/candidates', title: 'Hồ sơ ứng viên' },
  { path: '/recruitment/settings', title: 'Tuyển dụng' },
];

test.describe('HRM pages', () => {
  for (const { path, title } of hrmPages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }

  test('dashboard redirects to operations and exposes project drilldown', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/operations\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Tổng quan Vận hành Dự án' })).toBeVisible();
    await expect(page.getByRole('listitem', { name: /^Dự án:/ })).toHaveAttribute('href', '/operations/projects');
  });

  test('members settings shows one-time onboarding invites', async ({ page }) => {
    await page.goto('/members/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Phòng ban' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Form khai báo thông tin nhân viên' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tạo liên kết 7 ngày' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Liên kết đã tạo' })).toBeVisible();
  });

  test('recruitment settings shows position form', async ({ page }) => {
    await page.goto('/recruitment/settings');
    await expect(page.getByRole('heading', { name: 'Vị trí ứng tuyển' })).toBeVisible();
    await expect(page.getByPlaceholder('Tên vị trí mới (VD: Kỹ sư phần mềm, Kế toán trưởng...)')).toBeVisible();
  });

  test('profile loads linked employee record', async ({ page }) => {
    const token = await loginToken();
    const meRes = await fetch(`${e2eEnv.apiBaseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!meRes.ok) throw new Error(`E2E /api/auth/me failed (${meRes.status})`);
    const me = (await meRes.json()) as { employeeId?: string; name?: string };
    test.skip(!me.employeeId, 'Logged-in user has no linked employee profile');

    const employee = await getEmployee(token, me.employeeId!);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1, name: employee.fullName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thông tin cơ bản' })).toBeVisible();
  });
});
