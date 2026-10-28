import { test, expect } from '@playwright/test';
import { deleteExportReturn, loginToken, type VoucherApiDto } from './helpers/api';
import { clickDropdownItem, expectSnackbar, openRowActions } from './helpers/ui';
import { createApprovedExportFixture, createStockFixture, fixtureItem, fixtureRequest, getFixtureStock } from './helpers/purchasingFixtures';

test.describe('WMS material return', () => {
  test('creates a return draft from an isolated approved export', async ({ page }) => {
    const token = await loginToken();
    const fixture = await createStockFixture(token);
    const source = await createApprovedExportFixture(token, fixture);
    let voucher: VoucherApiDto | undefined;
    try {
      await page.goto('/warehouse/material-return');
      await page.getByRole('button', { name: 'Tạo phiếu hoàn trả', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Tạo phiếu hoàn trả vật tư' });
      await dialog.getByLabel('Kho dự án', { exact: true }).selectOption(fixture.projectCode);
      await dialog.getByLabel('Phiếu xuất nguồn', { exact: true }).selectOption(source.id);
      await dialog.locator('textarea').fill('E2E: unused material returned after installation');
      await dialog.getByRole('spinbutton', { name: `Số lượng hoàn trả cho ${fixture.materialCode}`, exact: true }).fill('1');

      const saved = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/export-returns'));
      await dialog.getByRole('button', { name: 'Lưu nháp', exact: true }).click();
      const response = await saved;
      expect(response.ok(), await response.text()).toBeTruthy();
      voucher = await response.json() as VoucherApiDto;
      await expectSnackbar(page, `Phiếu nháp ${voucher.voucherCode}`);
      await expect(dialog).toBeHidden();
      expect(voucher.status).toBe('draft');
      expect(await getFixtureStock(token, fixture)).toBe(6);
      expect((await fixtureRequest<VoucherApiDto>(token, 'GET', `/api/export-returns/${voucher.id}`)).status).toBe('draft');
    } finally {
      if (voucher) await deleteExportReturn(voucher.id, token);
    }
  });

  test('opens detail for its own return voucher', async ({ page }) => {
    const token = await loginToken();
    const fixture = await createStockFixture(token);
    const source = await createApprovedExportFixture(token, fixture);
    const voucher = await fixtureRequest<VoucherApiDto>(token, 'POST', '/api/export-returns', {
      voucherCode: '', date: new Date().toISOString().slice(0, 10), sourceExportId: source.id,
      items: [fixtureItem(fixture, 1)], status: 'draft', note: 'E2E return details', project: fixture.projectCode,
    });
    try {
      await page.goto('/warehouse/material-return');
      await page.getByRole('searchbox').fill(voucher.voucherCode);
      await openRowActions(page, voucher.voucherCode);
      await clickDropdownItem(page, 'Xem chi tiết');
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: voucher.voucherCode })).toBeVisible();
      await expect(dialog.getByText(fixture.materialCode, { exact: true })).toBeVisible();
      await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
    } finally {
      await deleteExportReturn(voucher.id, token);
    }
  });
});
