import { test, expect } from '@playwright/test';
import {
  cancelStocktake,
  createFrozenStocktake,
  findProjectWithStock,
  loginToken,
} from './helpers/api';
import {
  bumpQtyStepper,
  expectSnackbar,
  fillImportDraftForm,
  pickFirstAutocomplete,
} from './helpers/ui';

test.describe('WMS freeze guard', () => {
  test('blocks export chốt dự kiến when project is frozen', async ({ page }) => {
    const token = await loginToken();
    const stock = await findProjectWithStock(token);
    test.skip(!stock, 'No unfrozen project for freeze guard export test');

    const note = `E2E-FREEZE-EXPORT-${Date.now()}`;
    let stocktakeId: string | undefined;

    try {
      const created = await createFrozenStocktake(
        token,
        stock!.projectCode,
        stock!.projectName,
        stock!.materialCode,
        stock!.materialName,
        note,
      );
      stocktakeId = created.id;

      await page.goto('/warehouse/export');
      await page.getByRole('button', { name: 'Tạo phiếu xuất' }).click();

      const dialog = page.getByRole('dialog', { name: 'Tạo phiếu xuất kho dự án' });
      await dialog.locator('select.form-select').first().selectOption(stock!.projectCode);
      await pickFirstAutocomplete(page, dialog.locator('.search-autocomplete__input').first());
      await bumpQtyStepper(dialog.locator('.qty-stepper').first(), 1);

      await dialog.getByRole('button', { name: 'Chốt dự kiến' }).click();
      await expectSnackbar(page, /đóng băng kiểm kê/i);
      await expect(page.getByRole('dialog', { name: 'Tạo phiếu xuất kho dự án' })).toBeVisible();
    } finally {
      if (stocktakeId) await cancelStocktake(stocktakeId, token);
    }
  });

  test('blocks import chốt dự kiến when project is frozen', async ({ page }) => {
    const token = await loginToken();
    const stock = await findProjectWithStock(token);
    test.skip(!stock, 'No unfrozen project for freeze guard import test');

    const note = `E2E-FREEZE-IMPORT-${Date.now()}`;
    let stocktakeId: string | undefined;

    try {
      const created = await createFrozenStocktake(
        token,
        stock!.projectCode,
        stock!.projectName,
        stock!.materialCode,
        stock!.materialName,
        note,
      );
      stocktakeId = created.id;

      await page.goto('/warehouse/import');
      await page.getByRole('button', { name: 'Tạo phiếu nhập' }).click();

      const dialog = page.getByRole('dialog', { name: 'Tạo phiếu nhập kho dự án' });
      await dialog.locator('select.form-select').first().selectOption(stock!.projectCode);
      await pickFirstAutocomplete(page, dialog.getByPlaceholder('Chọn NCC từ danh mục…'));
      await dialog.locator('.form-field').filter({ hasText: 'Mã tham chiếu / PO' }).locator('input').fill(`PO-${Date.now()}`);
      await pickFirstAutocomplete(page, dialog.getByPlaceholder('— Vật tư —'));
      await bumpQtyStepper(dialog.locator('.qty-stepper').first(), 1);
      await dialog.locator('.currency-input-group__input, input.input-no-spinner').first().fill('10000');

      await dialog.getByRole('button', { name: 'Chốt dự kiến' }).click();
      await expectSnackbar(page, /đóng băng kiểm kê/i);
      await expect(page.getByRole('dialog', { name: 'Tạo phiếu nhập kho dự án' })).toBeVisible();
    } finally {
      if (stocktakeId) await cancelStocktake(stocktakeId, token);
    }
  });

  test('blocks transfer chốt dự kiến when source project is frozen', async ({ page }) => {
    const token = await loginToken();
    const stock = await findProjectWithStock(token);
    test.skip(!stock, 'No unfrozen project stock for freeze guard transfer test');

    const note = `E2E-FREEZE-TRANSFER-${Date.now()}`;
    let stocktakeId: string | undefined;

    try {
      const created = await createFrozenStocktake(
        token,
        stock!.projectCode,
        stock!.projectName,
        stock!.materialCode,
        stock!.materialName,
        note,
      );
      stocktakeId = created.id;

      await page.goto('/warehouse/transfer');
      await page.getByRole('button', { name: 'Tạo phiếu chuyển' }).click();

      const dialog = page.getByRole('dialog', { name: 'Tạo phiếu chuyển kho dự án' });
      await dialog.locator('select.form-select').first().selectOption(stock!.projectCode);
      await pickFirstAutocomplete(page, dialog.locator('.search-autocomplete__input').first());
      await bumpQtyStepper(dialog.locator('.qty-stepper').first(), 1);

      await dialog.getByRole('button', { name: 'Chốt dự kiến' }).click();
      await expectSnackbar(page, /đóng băng kiểm kê/i);
      await expect(page.getByRole('dialog', { name: 'Tạo phiếu chuyển kho dự án' })).toBeVisible();
    } finally {
      if (stocktakeId) await cancelStocktake(stocktakeId, token);
    }
  });
});
