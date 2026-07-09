import { test, expect } from '@playwright/test';
import {
  deleteExport,
  deleteImport,
  deleteTransfer,
  findProjectWithStock,
  findUnfrozenProject,
  findVoucherIdByCode,
  listImports,
  loginToken,
} from './helpers/api';
import {
  bumpQtyStepper,
  clickVoucherRow,
  expectSnackbar,
  extractVoucherCode,
  fillImportDraftForm,
  pickFirstAutocomplete,
  selectFirstProjectOption,
} from './helpers/ui';

test.describe('WMS voucher create (draft)', () => {
  test('import draft creates NK voucher', async ({ page }) => {
    const token = await loginToken();
    const project = await findUnfrozenProject(token);
    test.skip(!project, 'No unfrozen project available for import E2E');

    const tag = `E2E-NK-${Date.now()}`;
    let voucherCode: string | undefined;
    let voucherId: string | undefined;

    try {
      await page.goto('/warehouse/import');
      await page.getByRole('button', { name: 'Tạo phiếu nhập' }).click();

      const dialog = page.getByRole('dialog', { name: 'Tạo phiếu nhập kho dự án' });
      await expect(dialog).toBeVisible();
      await fillImportDraftForm(page, dialog, tag, project!.projectCode);

      await dialog.getByRole('button', { name: 'Lưu nháp' }).click();
      const toast = await expectSnackbar(page, /Phiếu nháp .* — chưa chốt dự kiến/);
      voucherCode = extractVoucherCode(await toast.textContent(), 'NK');
      expect(voucherCode).toBeTruthy();

      await expect(page.getByRole('cell', { name: voucherCode! })).toBeVisible();

      const token = await loginToken();
      voucherId = await findVoucherIdByCode(token, 'imports', voucherCode!);
      expect(voucherId).toBeTruthy();
    } finally {
      if (voucherId) {
        const token = await loginToken();
        await deleteImport(voucherId, token).catch(() => undefined);
      }
    }
  });

  test('export draft creates XK voucher when project has stock', async ({ page }) => {
    const token = await loginToken();
    const stock = await findProjectWithStock(token);
    test.skip(!stock, 'No unfrozen project stock available for export E2E');

    let voucherCode: string | undefined;
    let voucherId: string | undefined;

    try {
      await page.goto('/warehouse/export');
      await page.getByRole('button', { name: 'Tạo phiếu xuất' }).click();

      const dialog = page.getByRole('dialog', { name: 'Tạo phiếu xuất kho dự án' });
      await dialog.locator('select.form-select').first().selectOption(stock!.projectCode);
      await pickFirstAutocomplete(page, dialog.locator('.search-autocomplete__input').first());
      await bumpQtyStepper(dialog.locator('.qty-stepper').first(), 1);

      await dialog.getByRole('button', { name: 'Lưu nháp' }).click();
      const toast = await expectSnackbar(page, /Phiếu nháp .* — chưa chốt dự kiến/);
      voucherCode = extractVoucherCode(await toast.textContent(), 'XK');
      expect(voucherCode).toBeTruthy();

      voucherId = await findVoucherIdByCode(token, 'exports', voucherCode!);
      expect(voucherId).toBeTruthy();
    } finally {
      if (voucherId) {
        await deleteExport(voucherId, token).catch(() => undefined);
      }
    }
  });

  test('transfer draft creates KC voucher when project has stock', async ({ page }) => {
    const token = await loginToken();
    const stock = await findProjectWithStock(token);
    test.skip(!stock, 'No unfrozen project stock available for transfer E2E');

    let voucherCode: string | undefined;
    let voucherId: string | undefined;

    try {
      await page.goto('/warehouse/transfer');
      await page.getByRole('button', { name: 'Tạo phiếu chuyển' }).click();

      const dialog = page.getByRole('dialog', { name: 'Tạo phiếu chuyển kho dự án' });
      await dialog.locator('select.form-select').first().selectOption(stock!.projectCode);
      await pickFirstAutocomplete(page, dialog.locator('.search-autocomplete__input').first());
      await bumpQtyStepper(dialog.locator('.qty-stepper').first(), 1);

      await dialog.getByRole('button', { name: 'Lưu nháp' }).click();
      const toast = await expectSnackbar(page, /Phiếu nháp .* — chưa chốt dự kiến/);
      voucherCode = extractVoucherCode(await toast.textContent(), 'KC');
      expect(voucherCode).toBeTruthy();

      voucherId = await findVoucherIdByCode(token, 'transfers', voucherCode!);
      expect(voucherId).toBeTruthy();
    } finally {
      if (voucherId) {
        await deleteTransfer(voucherId, token).catch(() => undefined);
      }
    }
  });
});

test.describe('WMS voucher detail modal', () => {
  test('import draft opens detail modal from row click', async ({ page }) => {
    const token = await loginToken();
    const imports = await listImports(token);
    const draft = imports.find(item => item.status === 'draft');
    test.skip(!draft, 'No import draft in DB to open detail');

    await page.goto('/warehouse/import');
    await clickVoucherRow(page, draft!.voucherCode);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: draft!.voucherCode })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Duyệt dự kiến' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  });
});
