import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect, type Locator, type Page } from '@playwright/test';
import { e2eEnv } from './env';
import type { VoucherApiDto } from './api';

export interface PurchasingFixture {
  projectCode: string;
  projectName: string;
  materialCode: string;
  materialName: string;
  unit: string;
  orderCode: string;
  orderLineId: number;
  quantity: number;
}

// Mutation fixtures use the user's isolated local test environment.
export async function fixtureResponse(token: string, method: string, route: string, body?: unknown): Promise<Response> {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(e2eEnv.apiBaseUrl).hostname)) {
    throw new Error('Purchasing/WMS fixtures require a local API and a dedicated test database.');
  }
  const multipart = body instanceof FormData;
  return fetch(`${e2eEnv.apiBaseUrl}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
    },
    body: multipart ? body : body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
}

export async function fixtureRequest<T>(token: string, method: string, route: string, body?: unknown): Promise<T> {
  const response = await fixtureResponse(token, method, route, body);
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

const today = () => new Date().toISOString().slice(0, 10);

export async function createPlacedPoFixture(token: string): Promise<PurchasingFixture> {
  const suffix = randomUUID().slice(0, 8);
  const [user, categories, units] = await Promise.all([
    fixtureRequest<{ id: string }>(token, 'GET', '/api/auth/me'),
    fixtureRequest<Array<{ id: number; level: number }>>(token, 'GET', '/api/categories'),
    fixtureRequest<Array<{ name: string; isActive: boolean }>>(token, 'GET', '/api/material-units'),
  ]);
  const category = categories.find(item => item.level >= 2);
  const unit = units.find(item => item.isActive);
  if (!category || !unit) throw new Error('The local test seed must include a material category and an active unit.');
  const projectCode = `E2E-WMS-${suffix}`;
  const projectName = `E2E WMS ${suffix}`;
  const materialCode = `E2E-MAT-${suffix}`;
  const materialName = `E2E material ${suffix}`;
  await fixtureRequest(token, 'POST', '/api/warehouse/projects', {
    projectCode, projectName, projectType: 'Project', pmId: user.id, pmName: 'E2E administrator',
    startDate: today(), materialBudget: 100_000_000, stage: 'procurement',
  });
  await fixtureRequest(token, 'POST', '/api/warehouse/materials', {
    materialCode, materialName, categoryId: category.id, unit: unit.name, isConsumable: false, ceilingPrice: 1000,
  });
  const supplier = await fixtureRequest<{ id: number; supplierName: string }>(token, 'POST', '/api/warehouse/suppliers', {
    supplierCode: `E2E-NCC-${suffix}`, supplierName: `E2E supplier ${suffix}`, maxDebtDays: 30,
  });
  await fixtureRequest(token, 'POST', `/api/warehouse/suppliers/${supplier.id}/approve`);
  const quantity = 10;
  const plan = await fixtureRequest<{ code: string; lines: Array<{ id: number }> }>(token, 'POST', '/api/purchasing/plans', {
    projectCode, kind: 'plan', note: 'Isolated E2E WMS fixture',
    lines: [{ materialCode, productName: materialName, unit: unit.name, quantity,
      budgetUnitPrice: 1000, budgetAmount: 10_000, selectedUnitPrice: 1000, selectedAmount: 10_000,
      selectedSupplierName: supplier.supplierName }],
  });
  for (const action of ['submit', 'approve-l1', 'approve-l2']) {
    await fixtureRequest(token, 'POST', `/api/purchasing/plans/${plan.code}/${action}`);
  }
  const order = await fixtureRequest<{ code: string; lines: Array<{ id: number }> }>(token, 'POST', '/api/purchasing/orders', {
    planCode: plan.code, supplierId: supplier.id, orderDate: today(), note: 'Isolated E2E WMS fixture',
    lines: [{ planLineId: plan.lines[0].id, qty: quantity, unitPrice: 1000 }],
    installments: [{ stageNumber: 1, percent: 100, requiredDocTypes: ['INVOICE'] }],
  });
  for (const action of ['approve', 'place']) {
    await fixtureRequest(token, 'POST', `/api/purchasing/orders/${order.code}/${action}`);
  }
  return { projectCode, projectName, materialCode, materialName, unit: unit.name, orderCode: order.code, orderLineId: order.lines[0].id, quantity };
}

export async function addReceiptEvidence(token: string, receiptId: string): Promise<void> {
  await fixtureRequest(token, 'PUT', `/api/imports/${receiptId}/receipt-evaluation`, { evaluation: 'E2E: goods counted and accepted in full.' });
  for (const [kind, fileName, type] of [['photo', 'tiny.png', 'image/png'], ['document', 'tiny.pdf', 'application/pdf']]) {
    const data = new FormData();
    data.set('kind', kind);
    data.set('file', new Blob([new Uint8Array(fs.readFileSync(path.join('e2e', 'fixtures', fileName)))], { type }), fileName);
    await fixtureRequest(token, 'POST', `/api/imports/${receiptId}/attachments`, data);
  }
}

export async function createPoImportFixture(token: string, fixture: PurchasingFixture, status: 'draft' | 'pending' | 'approved' = 'draft'): Promise<VoucherApiDto> {
  let receipt = await fixtureRequest<VoucherApiDto>(token, 'POST', `/api/imports/from-po/${fixture.orderCode}`, {
    items: [{ poItemId: fixture.orderLineId, qty: fixture.quantity }], isDirectProcurement: false, issueFromGeneralWarehouse: false,
  });
  if (status !== 'draft') receipt = await fixtureRequest(token, 'POST', `/api/imports/${receipt.id}/submit`);
  if (status === 'approved') {
    await addReceiptEvidence(token, receipt.id);
    receipt = await fixtureRequest(token, 'POST', `/api/imports/${receipt.id}/approve`, { confirmOverBudget: false });
  }
  expect(receipt.status).toBe(status);
  return receipt;
}

export async function createStockFixture(token: string): Promise<PurchasingFixture> {
  const fixture = await createPlacedPoFixture(token);
  await createPoImportFixture(token, fixture, 'approved');
  expect(await getFixtureStock(token, fixture)).toBe(fixture.quantity);
  return fixture;
}

export function fixtureItem(fixture: PurchasingFixture, qty: number) {
  return { productId: fixture.materialCode, sku: fixture.materialCode, name: fixture.materialName, unit: fixture.unit, qty };
}

export async function createApprovedExportFixture(token: string, fixture: PurchasingFixture): Promise<VoucherApiDto> {
  const voucher = await fixtureRequest<VoucherApiDto>(token, 'POST', '/api/exports', {
    voucherCode: '', date: today(), soCode: 'E2E-CONSUME', customer: 'E2E crew',
    warehouseId: fixture.projectCode, project: fixture.projectCode, items: [fixtureItem(fixture, 4)], status: 'draft', note: 'E2E return source',
  });
  await fixtureRequest(token, 'POST', `/api/exports/${voucher.id}/submit`);
  await fixtureRequest(token, 'POST', `/api/exports/${voucher.id}/approve`);
  expect(await getFixtureStock(token, fixture)).toBe(6);
  return voucher;
}

export async function getFixtureStock(token: string, fixture: PurchasingFixture): Promise<number> {
  const rows = await fixtureRequest<Array<{ materialCode: string; actualInventoryQty: number }>>(token, 'GET', `/api/warehouse/projects/${fixture.projectCode}/inventory`);
  return rows.find(row => row.materialCode === fixture.materialCode)?.actualInventoryQty ?? 0;
}

export async function openPoImportForm(page: Page, fixture: PurchasingFixture): Promise<Locator> {
  await page.goto(`/purchasing/orders/${encodeURIComponent(fixture.orderCode)}`);
  await page.getByRole('region', { name: 'Phiếu nhập kho', exact: true }).getByRole('button', { name: 'Tạo phiếu nhập', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo phiếu nhập kho dự án' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox', { name: `Chọn ${fixture.materialName}`, exact: true }).check();
  await dialog.getByRole('spinbutton', { name: 'Số lượng', exact: true }).fill(String(fixture.quantity));
  return dialog;
}

export async function fillStockVoucherForm(page: Page, dialog: Locator, fixture: PurchasingFixture): Promise<void> {
  await dialog.locator('select.form-select').first().selectOption(fixture.projectCode);
  await dialog.locator('.search-autocomplete__input').first().fill(fixture.materialCode);
  await page.getByRole('listbox').getByRole('option').filter({ hasText: fixture.materialCode }).click();
  await dialog.getByRole('spinbutton', { name: 'Số lượng', exact: true }).fill('1');
}
