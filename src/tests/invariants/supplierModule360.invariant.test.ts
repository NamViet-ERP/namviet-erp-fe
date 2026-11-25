import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe('Living Invariant 5: SRM 360° Closed-loop Integration', () => {
  const contactsPath = path.resolve(currentDir, '../../pages/suppliers/SupplierContactsPage.tsx');
  const masterPath = path.resolve(currentDir, '../../pages/warehouse/SuppliersSettingsPanel.tsx');
  const spendPath = path.resolve(currentDir, '../../pages/suppliers/SupplierSpendPage.tsx');
  const evaluationsPath = path.resolve(currentDir, '../../pages/suppliers/SupplierEvaluationsPage.tsx');
  const orderEvalPanelPath = path.resolve(currentDir, '../../components/suppliers/SupplierOrderEvaluationsPanel.tsx');

  it('SupplierContactsPage implements URL searchParams deep-linking with supplierId', () => {
    expect(fs.existsSync(contactsPath)).toBe(true);
    const content = fs.readFileSync(contactsPath, 'utf-8');
    expect(content).toContain('useSearchParams');
    expect(content).toContain("searchParams.get('supplierId')");
    expect(content).toContain('Đang lọc theo NCC:');
  });

  it('SuppliersSettingsPanel contains quick links in rowActions; SupplierDetailModal contains 360° Hub', () => {
    expect(fs.existsSync(masterPath)).toBe(true);
    const content = fs.readFileSync(masterPath, 'utf-8');
    // Row actions must remain in SuppliersSettingsPanel
    expect(content).toContain('/suppliers/debt?supplierId=');
    expect(content).toContain('/suppliers/contacts?supplierId=');
    expect(content).toContain('/purchasing/orders?search=');

    // 360° Action Hub and deep links are in SupplierDetailModal (extracted sub-component)
    const detailModalPath = path.resolve(currentDir, '../../pages/warehouse/suppliers/SupplierDetailModal.tsx');
    expect(fs.existsSync(detailModalPath)).toBe(true);
    const detailContent = fs.readFileSync(detailModalPath, 'utf-8');
    expect(detailContent).toContain('360° Hub:');
    expect(detailContent).toContain('/suppliers/evaluations?supplierId=');
    expect(detailContent).toContain('Xem bảng kê công nợ');
    expect(detailContent).toContain('Xem đơn hàng PO');
    expect(detailContent).toContain('Lịch sử đánh giá');
  });

  it('SupplierSpendPage enables seamless navigation to master list, debt and orders', () => {
    expect(fs.existsSync(spendPath)).toBe(true);
    const content = fs.readFileSync(spendPath, 'utf-8');
    expect(content).toContain('/suppliers/list?search=');
    expect(content).toContain('/suppliers/debt?supplierId=');
    expect(content).toContain('/purchasing/orders?search=');
  });

  it('SupplierEvaluationsPage and SupplierOrderEvaluationsPanel support supplierId and tab deep-linking', () => {
    expect(fs.existsSync(evaluationsPath)).toBe(true);
    const evalContent = fs.readFileSync(evaluationsPath, 'utf-8');
    expect(evalContent).toContain('useSearchParams');
    expect(evalContent).toContain("searchParams.get('supplierId')");
    expect(evalContent).toContain("searchParams.get('tab')");

    expect(fs.existsSync(orderEvalPanelPath)).toBe(true);
    const panelContent = fs.readFileSync(orderEvalPanelPath, 'utf-8');
    expect(panelContent).toContain('useSearchParams');
    expect(panelContent).toContain("searchParams.get('supplierId')");
    expect(panelContent).toContain('Đang lọc theo NCC:');
  });
});
