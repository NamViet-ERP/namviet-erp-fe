import { expect, type Locator, type Page } from '@playwright/test';

export function fieldInput(scope: Locator, label: string): Locator {
  return scope.locator('.form-field').filter({ hasText: label }).locator('input, select, textarea').first();
}

export async function expectSnackbar(page: Page, pattern: string | RegExp): Promise<Locator> {
  const message = page.locator('.nv-snackbar__message');
  await expect(message).toBeVisible();
  await expect(message).toContainText(pattern);
  return message;
}

export async function pickFirstAutocomplete(page: Page, input: Locator): Promise<void> {
  await input.click();
  await input.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('listbox').getByRole('option').first().click();
}

export async function fillImportDraftForm(
  page: Page,
  dialog: Locator,
  _referenceCode: string,
  projectCode?: string,
): Promise<string> {
  // Create flow is PO-bound: pick a placed PO whose project is not freeze-blocked.
  const poSelect = dialog.locator('select.form-input').first();
  await expect(async () => {
    expect(await poSelect.locator('option').count()).toBeGreaterThan(1);
  }).toPass({ timeout: 30_000 });

  const options = poSelect.locator('option');
  const count = await options.count();
  const candidates: Array<{ value: string; projectCode: string }> = [];
  for (let i = 0; i < count; i += 1) {
    const opt = options.nth(i);
    const value = (await opt.getAttribute('value'))?.trim() ?? '';
    if (!value) continue;
    const text = (await opt.textContent()) ?? '';
    const projectFromOption = text.split('·').map(s => s.trim()).at(-1) ?? '';
    candidates.push({ value, projectCode: projectFromOption });
  }

  const ordered = projectCode
    ? [
        ...candidates.filter(c => c.projectCode === projectCode || c.value.includes(projectCode)),
        ...candidates.filter(c => c.projectCode !== projectCode && !c.value.includes(projectCode)),
      ]
    : candidates;

  for (const candidate of ordered) {
    await poSelect.selectOption(candidate.value);
    try {
      await expect(dialog.getByRole('button', { name: 'Lưu nháp' })).toBeEnabled({ timeout: 5_000 });
      return candidate.projectCode || candidate.value;
    } catch {
      // Project likely freeze-blocked — try next PO.
    }
  }

  throw new Error('No placed PO with an unlocked project available for import E2E');
}

export async function clickVoucherRow(page: Page, voucherCode: string): Promise<void> {
  await page.locator('tr').filter({ hasText: voucherCode }).first().click();
}

export async function clickFirstInteractiveRow(page: Page): Promise<void> {
  const row = page.locator('.hrm-table-row--interactive').first();
  await expect(row).toBeVisible();
  await row.click();
}

export async function selectFirstProjectOption(select: Locator): Promise<string> {
  await expect(async () => {
    expect(await select.locator('option').count()).toBeGreaterThan(1);
  }).toPass();
  const value = await select.locator('option').nth(1).getAttribute('value');
  if (!value) throw new Error('No project option available');
  await select.selectOption(value);
  return value;
}

export async function bumpQtyStepper(scope: Locator, times = 1): Promise<void> {
  const increase = scope.getByRole('button', { name: 'Tăng số lượng' });
  for (let i = 0; i < times; i += 1) {
    await increase.click();
  }
}

export async function openRowActions(page: Page, rowMatcher: string | RegExp): Promise<void> {
  const row = page.locator('tr').filter({ hasText: rowMatcher }).first();
  await row.getByRole('button', { name: 'TÁC VỤ' }).click();
  await expect(page.locator('.nv-dropdown__menu')).toBeVisible();
}

export async function clickDropdownItem(page: Page, label: string | RegExp): Promise<void> {
  // Menu items use role="menuitem" (not "button") in the a11y tree.
  await page.locator('.nv-dropdown__menu').getByRole('menuitem', { name: label }).click();
}

export function extractVoucherCode(text: string | null, prefix: string): string | undefined {
  const re = new RegExp(`${prefix}-\\d{4}`);
  return text?.match(re)?.[0];
}

/** Field wrapper is the closest div that directly contains the label. */
export function hrmFieldGroup(scope: Page | Locator, label: string | RegExp): Locator {
  const labelEl = scope.locator('label.hrm-field__label', { hasText: label }).first();
  return labelEl.locator('xpath=ancestor::div[1]');
}

export function hrmFieldInput(scope: Page | Locator, label: string | RegExp): Locator {
  return hrmFieldGroup(scope, label)
    .locator('input.hrm-field-input, input[type="email"], input[type="tel"], input[type="text"]')
    .first();
}

export async function fillHrmDate(
  page: Page,
  fieldRoot: Locator,
  displayDate: string,
): Promise<void> {
  await fieldRoot.locator('button.hrm-date-picker__trigger').first().click();
  const dialog = page.getByRole('dialog', { name: 'Chọn ngày' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Nhập ngày theo định dạng dd/MM/yyyy').fill(displayDate);
  await dialog.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(dialog).toBeHidden();
}

export async function pickHrmSelect(
  page: Page,
  fieldRoot: Locator,
  optionLabel?: string,
): Promise<string> {
  await fieldRoot.locator('button[aria-haspopup="listbox"]').click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  const option = optionLabel
    ? listbox.getByRole('option', { name: optionLabel, exact: true })
    : listbox.getByRole('option').nth(1);
  await expect(option).toBeVisible();
  const chosen = (await option.innerText()).trim();
  await option.click();
  return chosen;
}

export async function uploadHrmImage(
  page: Page,
  label: string,
  filePath: string,
): Promise<void> {
  const zone = hrmFieldGroup(page, label);
  await zone.locator('input[type="file"]').setInputFiles(filePath);
  await expect(zone.locator('.hrm-upload-file')).toBeVisible({ timeout: 15_000 });
}

/** Field that shares a section/grid with another known label (e.g. CCCD Ngày cấp next to Số CCCD). */
export function hrmFieldNear(
  page: Page,
  nearLabel: string | RegExp,
  targetLabel: string | RegExp,
): Locator {
  const near = page.locator('label.hrm-field__label', { hasText: nearLabel }).first();
  const section = near.locator('xpath=ancestor::div[contains(@class,"hrm-form-grid")][1]');
  return section.locator('label.hrm-field__label', { hasText: targetLabel }).first().locator('xpath=ancestor::div[1]');
}
