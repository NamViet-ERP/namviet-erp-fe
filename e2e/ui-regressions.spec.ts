import { test, expect } from '@playwright/test';

test.describe('Public application feedback and keyboard controls', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/refresh', route => route.fulfill({ status: 401, json: {} }));
    await page.route('**/api/recruitment/positions', route => route.fulfill({ json: [{ name: 'Test opening', isActive: true }] }));
    await page.route('**/api/recruitment/hr-staff', route => route.fulfill({ json: [{ name: 'Test HR' }] }));
  });

  test('keyboard commits the highlighted option and errors describe their fields', async ({ page }) => {
    await page.goto('/recruitment/apply');
    const position = page.getByRole('combobox', { name: 'Vị trí ứng tuyển' });
    await expect(position).toBeEnabled();
    await position.focus();
    await position.press('ArrowDown');
    await position.press('ArrowDown');
    await position.press('Enter');
    await expect(position).toContainText('Test opening');
    await expect(position).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'GỬI HỒ SƠ ỨNG TUYỂN' }).click();
    await expect(page.locator('#candidate-full-name')).toBeFocused();
    await expect(page.locator('#candidate-full-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#candidate-full-name')).toHaveAttribute('aria-describedby', 'candidate-fullName-error');
    await expect(page.locator('#candidate-hrResponsible-error')).toContainText('Vui lòng chọn HR phụ trách');
    await page.getByRole('button', { name: 'Chọn file CV' }).focus();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await chooserPromise;
  });

  test('an empty HR directory explains why submission is unavailable', async ({ page }) => {
    await page.route('**/api/recruitment/hr-staff', route => route.fulfill({ json: [] }));
    await page.goto('/recruitment/apply');
    await expect(page.getByText('Chưa có nhân sự phụ trách để tiếp nhận hồ sơ.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'GỬI HỒ SƠ ỨNG TUYỂN' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'HR phụ trách' })).toBeDisabled();
  });

  test('a failed positions request offers retry and recovers', async ({ page }) => {
    let failing = true;
    await page.route('**/api/recruitment/positions', route => route.fulfill(failing
      ? { status: 503, json: { detail: 'Test outage' } }
      : { json: [{ name: 'Recovered opening', isActive: true }] }));
    await page.goto('/recruitment/apply');
    await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
    await expect(page.getByText('Hiện tại hệ thống chưa có đợt tuyển dụng công khai nào', { exact: false })).toHaveCount(0);
    failing = false;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(page.getByRole('button', { name: 'GỬI HỒ SƠ ỨNG TUYỂN' })).toBeEnabled();
    await page.getByRole('combobox', { name: 'Vị trí ứng tuyển' }).click();
    await expect(page.getByRole('option', { name: 'Recovered opening' })).toBeVisible();
  });
});

test('modal traps tab navigation and restores its trigger after Escape', async ({ page }) => {
  await page.goto('/recruitment/plans');
  const trigger = page.getByRole('button', { name: 'Thêm kế hoạch', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Đóng', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Lưu', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
