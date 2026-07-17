import { test, expect } from '@playwright/test';
import { getEmployee, loginToken } from './helpers/api';

const hrmPages: Array<{ path: string; title: string | RegExp }> = [
  { path: '/dashboard', title: /Xin chào/ },
  { path: '/members/list', title: 'Danh sách nhân viên' },
  { path: '/members/new', title: 'Thêm nhân viên' },
  { path: '/members/settings', title: 'Thiết lập nhân sự' },
  { path: '/recruitment/candidates', title: 'Hồ sơ ứng viên' },
  { path: '/recruitment/settings', title: 'Thiết lập tuyển dụng' },
];

test.describe('HRM pages', () => {
  for (const { path, title } of hrmPages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }

  test('dashboard shows department modules', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Chọn phân hệ để bắt đầu')).toBeVisible();
    await expect(page.getByText('HRM')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /^Kho hàng$/i })).toBeVisible();
  });

  test('members settings shows one-time onboarding invites', async ({ page }) => {
    await page.goto('/members/settings');
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
    const employee = await getEmployee(token, '3');
    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1, name: employee.fullName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thông tin cơ bản' })).toBeVisible();
  });
});
