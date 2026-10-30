import { test, expect } from '@playwright/test';
import {
  cancelStocktake,
  listStocktakes,
  loginToken,
} from './helpers/api';
import {
  clickDropdownItem,
  expectSnackbar,
  extractVoucherCode,
  openRowActions,
  pickFirstAutocomplete,
  selectFirstProjectOption,
} from './helpers/ui';

test.describe('WMS stocktake', () => {
  test('create stocktake generates KK code and freezes by default', async ({ page }) => {
    const e2eNote = `E2E-KK-${Date.now()}`;
    let createdId: string | undefined;

    try {
      await page.goto('/stocktake/list');
      await page.getByRole('button', { name: /TẠO MỚI/i }).click();

      const dialog = page.getByRole('dialog', { name: 'TẠO PHIẾU KIỂM KÊ' });
      await selectFirstProjectOption(dialog.locator('select.form-select').first());
      await dialog.getByPlaceholder('Kiểm kê cuối tháng...').fill(e2eNote);
      await pickFirstAutocomplete(page, dialog.locator('.search-autocomplete__input'));
      await dialog.getByRole('button', { name: 'Tạo phiếu kiểm kê' }).click();

      const toast = await expectSnackbar(page, /Phiếu kiểm kê KK-\d{4}/);
      const voucherCode = extractVoucherCode(await toast.textContent(), 'KK');
      expect(voucherCode).toBeTruthy();

      const row = page.locator('tr', { has: page.getByRole('cell', { name: voucherCode! }) });
      await expect(row.getByText('Đóng băng', { exact: true })).toBeVisible();

      const token = await loginToken();
      const stocktakes = await listStocktakes(token);
      createdId = stocktakes.find(s => s.voucherCode === voucherCode)?.id;
      expect(createdId).toBeTruthy();
    } finally {
      if (createdId) {
        const token = await loginToken();
        await cancelStocktake(createdId, token);
      }
    }
  });

  test('toggle freeze via row actions', async ({ page }) => {
    const e2eNote = `E2E-FREEZE-TOGGLE-${Date.now()}`;
    let createdId: string | undefined;
    let voucherCode: string | undefined;

    try {
      await page.goto('/stocktake/list');
      await page.getByRole('button', { name: /TẠO MỚI/i }).click();

      const dialog = page.getByRole('dialog', { name: 'TẠO PHIẾU KIỂM KÊ' });
      await selectFirstProjectOption(dialog.locator('select.form-select').first());
      await dialog.getByPlaceholder('Kiểm kê cuối tháng...').fill(e2eNote);
      await pickFirstAutocomplete(page, dialog.locator('.search-autocomplete__input'));
      await dialog.getByRole('button', { name: 'Tạo phiếu kiểm kê' }).click();

      const toast = await expectSnackbar(page, /Phiếu kiểm kê KK-\d{4}/);
      voucherCode = extractVoucherCode(await toast.textContent(), 'KK');
      expect(voucherCode).toBeTruthy();

      const token = await loginToken();
      createdId = (await listStocktakes(token)).find(s => s.voucherCode === voucherCode)?.id;

      await openRowActions(page, voucherCode!);
      await clickDropdownItem(page, 'Mở băng');
      await expectSnackbar(page, `Vật tư phiếu ${voucherCode} đã mở băng.`);

      const row = page.locator('tr', { has: page.getByRole('cell', { name: voucherCode! }) });
      await expect(row.getByText('Mở băng', { exact: true })).toBeVisible();

      await openRowActions(page, voucherCode!);
      await clickDropdownItem(page, 'Đóng băng');
      await expectSnackbar(page, `Vật tư phiếu ${voucherCode} đã đóng băng.`);
      await expect(row.getByText('Đóng băng', { exact: true })).toBeVisible();
    } finally {
      if (createdId) {
        const token = await loginToken();
        await cancelStocktake(createdId, token);
      }
    }
  });

  test('cancel pending stocktake from row actions', async ({ page }) => {
    const e2eNote = `E2E-CANCEL-${Date.now()}`;

    await page.goto('/stocktake/list');
    await page.getByRole('button', { name: /TẠO MỚI/i }).click();

    const dialog = page.getByRole('dialog', { name: 'TẠO PHIẾU KIỂM KÊ' });
    await selectFirstProjectOption(dialog.locator('select.form-select').first());
    await dialog.getByPlaceholder('Kiểm kê cuối tháng...').fill(e2eNote);
    await pickFirstAutocomplete(page, dialog.locator('.search-autocomplete__input'));
    await dialog.getByRole('button', { name: 'Tạo phiếu kiểm kê' }).click();

    const toast = await expectSnackbar(page, /Phiếu kiểm kê KK-\d{4}/);
    const voucherCode = extractVoucherCode(await toast.textContent(), 'KK');
    expect(voucherCode).toBeTruthy();

    await openRowActions(page, voucherCode!);
    await clickDropdownItem(page, 'Hủy phiếu');
    await expectSnackbar(page, /Đã hủy phiếu/);

    await page.getByRole('button', { name: /^Đã hủy/ }).click();
    await expect(page.getByRole('cell', { name: voucherCode! })).toBeVisible();
  });

  test('stocktake detail shows freeze status', async ({ page }) => {
    const token = await loginToken();
    const pending = (await listStocktakes(token)).find(s => s.status === 'pending');
    test.skip(!pending, 'No pending stocktake for detail test');

    await page.goto('/stocktake/list');
    await page.getByPlaceholder('Tìm mã phiếu, kho dự án...').fill(pending!.voucherCode);
    await openRowActions(page, pending!.voucherCode);
    await clickDropdownItem(page, 'Xem chi tiết');

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: new RegExp(pending!.voucherCode) })).toBeVisible();
    await expect(dialog.getByText(/Đang đóng băng|Đã mở băng/)).toBeVisible();
    await dialog.locator('button.btn-outline', { hasText: 'Đóng' }).click();
  });
});
