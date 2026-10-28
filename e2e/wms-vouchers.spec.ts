import { test, expect } from '@playwright/test';
import { deleteExport, deleteImport, deleteTransfer, loginToken, type VoucherApiDto } from './helpers/api';
import { expectSnackbar } from './helpers/ui';
import { createPlacedPoFixture, createPoImportFixture, createStockFixture, fillStockVoucherForm, fixtureRequest, getFixtureStock, openPoImportForm } from './helpers/purchasingFixtures';

test.describe('WMS voucher create (draft)', () => {
  test('import draft creates NK voucher from its placed PO', async ({ page }) => {
    const token = await loginToken();
    const fixture = await createPlacedPoFixture(token);
    let voucher: VoucherApiDto | undefined;
    try {
      const dialog = await openPoImportForm(page, fixture);
      const saved = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith(`/api/imports/from-po/${fixture.orderCode}`));
      await dialog.getByRole('button', { name: 'Lưu nháp' }).click();
      const response = await saved;
      expect(response.ok(), await response.text()).toBeTruthy();
      voucher = await response.json() as VoucherApiDto;
      await expectSnackbar(page, `Phiếu nháp ${voucher.voucherCode}`);
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('region', { name: 'Phiếu nhập kho', exact: true }).getByText(voucher.voucherCode, { exact: true })).toBeVisible();
      expect((await fixtureRequest<VoucherApiDto>(token, 'GET', `/api/imports/${voucher.id}`)).status).toBe('draft');
      expect(await getFixtureStock(token, fixture)).toBe(0);
    } finally {
      if (voucher) await deleteImport(voucher.id, token);
    }
  });

  for (const kind of ['export', 'transfer'] as const) {
    test(`${kind} draft creates a voucher from isolated project stock`, async ({ page }) => {
      const token = await loginToken();
      const fixture = await createStockFixture(token);
      const title = kind === 'export' ? 'Tạo phiếu xuất' : 'Tạo phiếu chuyển';
      const route = kind === 'export' ? 'exports' : 'transfers';
      let voucher: VoucherApiDto | undefined;
      try {
        await page.goto(`/warehouse/${kind}`);
        await page.getByRole('button', { name: title, exact: true }).click();
        const dialog = page.getByRole('dialog', { name: `${title} kho dự án` });
        await fillStockVoucherForm(page, dialog, fixture);
        const saved = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith(`/api/${route}`));
        await dialog.getByRole('button', { name: 'Lưu nháp' }).click();
        const response = await saved;
        expect(response.ok(), await response.text()).toBeTruthy();
        voucher = await response.json() as VoucherApiDto;
        await expectSnackbar(page, `Phiếu nháp ${voucher.voucherCode}`);
        await expect(dialog).toBeHidden();
        expect(voucher.status).toBe('draft');
        expect(await getFixtureStock(token, fixture)).toBe(10);
      } finally {
        if (voucher) await (kind === 'export' ? deleteExport : deleteTransfer)(voucher.id, token);
      }
    });
  }
});

test('import draft opens detail in its PO', async ({ page }) => {
  const token = await loginToken();
  const fixture = await createPlacedPoFixture(token);
  const voucher = await createPoImportFixture(token, fixture);
  try {
    await page.goto(`/purchasing/orders/${encodeURIComponent(fixture.orderCode)}`);
    await page.getByRole('region', { name: 'Phiếu nhập kho', exact: true }).getByText(voucher.voucherCode, { exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: voucher.voucherCode })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Sửa phiếu', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  } finally {
    await deleteImport(voucher.id, token);
  }
});
