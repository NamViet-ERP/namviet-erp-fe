import { test, expect } from '@playwright/test';
import { cancelStocktake, createFrozenStocktake, deleteImport, loginToken, type VoucherApiDto } from './helpers/api';
import { expectSnackbar } from './helpers/ui';
import { addReceiptEvidence, createPlacedPoFixture, createPoImportFixture, createStockFixture, fillStockVoucherForm, fixtureRequest, getFixtureStock } from './helpers/purchasingFixtures';

test.describe('WMS freeze guard', () => {
  for (const kind of ['export', 'transfer'] as const) {
    test(`blocks ${kind} submission when the project is frozen after opening the form`, async ({ page }) => {
      const token = await loginToken();
      const fixture = await createStockFixture(token);
      const title = kind === 'export' ? 'Tạo phiếu xuất' : 'Tạo phiếu chuyển';
      const route = kind === 'export' ? 'exports' : 'transfers';
      let stocktakeId: string | undefined;
      try {
        await page.goto(`/warehouse/${kind}`);
        await page.getByRole('button', { name: title, exact: true }).click();
        const dialog = page.getByRole('dialog', { name: `${title} kho dự án` });
        await fillStockVoucherForm(page, dialog, fixture);
        const stocktake = await createFrozenStocktake(token, fixture.projectCode, fixture.projectName, fixture.materialCode, fixture.materialName, 'E2E freeze after form opened');
        stocktakeId = stocktake.id;

        const rejected = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith(`/api/${route}`));
        await dialog.getByRole('button', { name: 'Chốt dự kiến' }).click();
        expect((await rejected).status()).toBe(409);
        await expectSnackbar(page, /đóng băng kiểm kê/i);
        await expect(dialog).toBeVisible();
        expect(await getFixtureStock(token, fixture)).toBe(10);
        const vouchers = await fixtureRequest<VoucherApiDto[]>(token, 'GET', `/api/${route}`);
        expect(vouchers.filter(voucher => voucher.project === fixture.projectCode)).toHaveLength(0);
      } finally {
        if (stocktakeId) await cancelStocktake(stocktakeId, token);
      }
    });
  }

  test('blocks warehouse approval of a PO receipt while its project is frozen', async ({ page }) => {
    const token = await loginToken();
    const fixture = await createPlacedPoFixture(token);
    const receipt = await createPoImportFixture(token, fixture, 'pending');
    let stocktakeId: string | undefined;
    try {
      await addReceiptEvidence(token, receipt.id);
      const stocktake = await createFrozenStocktake(token, fixture.projectCode, fixture.projectName, fixture.materialCode, fixture.materialName, 'E2E frozen receipt approval');
      stocktakeId = stocktake.id;
      await page.goto('/warehouse/import');
      await page.getByRole('searchbox').fill(receipt.voucherCode);
      await page.locator('tr').filter({ hasText: receipt.voucherCode }).click();
      const dialog = page.getByRole('dialog');
      const rejected = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith(`/api/imports/${receipt.id}/approve`));
      await dialog.getByRole('button', { name: 'Duyệt thực tế', exact: true }).click();
      expect((await rejected).status()).toBe(409);
      await expectSnackbar(page, /đóng băng kiểm kê/i);
      await expect(dialog).toBeVisible();
      expect((await fixtureRequest<VoucherApiDto>(token, 'GET', `/api/imports/${receipt.id}`)).status).toBe('pending');
      expect(await getFixtureStock(token, fixture)).toBe(0);
    } finally {
      if (stocktakeId) await cancelStocktake(stocktakeId, token);
      await deleteImport(receipt.id, token);
    }
  });
});
