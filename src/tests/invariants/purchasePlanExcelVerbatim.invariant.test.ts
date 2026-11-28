import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeWebStageAmount,
  emptyLine,
  fromExistingPlanLines,
  fromPreviewLines,
  resolveDraftStageAmount,
  toApiLines,
} from '../../components/purchasing/createPurchasePlanDraft';
import { buildPurchasePlanReconciliation } from '../../components/purchasing/purchasePlanReconciliation';
import type {
  PurchasePlanImportLinePreviewApiDto,
  PurchasePlanLineApiDto,
} from '../../types/api/purchasingApi';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe('Living Invariant: KHMH Excel Verbatim Amount Preservation (Zero Auto-Recalculation)', () => {
  it('preserves exact Inox 304 Excel amounts without multiplying by quantity or kgPerUnit', () => {
    const preview: PurchasePlanImportLinePreviewApiDto[] = [
      {
        rowNumber: 2,
        lineNo: 1,
        isValid: true,
        lineType: 'material',
        materialCode: 'VT-INOX-304',
        productName: 'Tấm Inox 304 dày 10mm',
        unit: 'Tấm',
        quantity: 16,
        kgPerUnit: 194,
        budgetUnitPrice: 928_000,
        budgetAmount: 180_032_000,
        proposalKgPerUnit: 194,
        proposalUnitPrice: 13_916_000,
        proposalAmount: 222_656_000,
        purchaseKgPerUnit: 194,
        purchaseUnitPrice: 13_725_000,
        purchaseAmount: 219_600_000,
        selectedUnitPrice: 13_916_000,
        selectedAmount: 222_656_000,
        quotes: [],
      },
    ];

    const drafts = fromPreviewLines(preview);
    expect(resolveDraftStageAmount(drafts[0], 'budget')).toBe(180_032_000);
    expect(resolveDraftStageAmount(drafts[0], 'proposal')).toBe(222_656_000);
    expect(resolveDraftStageAmount(drafts[0], 'purchase')).toBe(219_600_000);
    expect(resolveDraftStageAmount(drafts[0], 'selected')).toBe(222_656_000);

    const apiLines = toApiLines(drafts);
    expect(apiLines).toHaveLength(1);
    expect(apiLines[0].budgetAmount).toBe(180_032_000);
    expect(apiLines[0].proposalAmount).toBe(222_656_000);
    expect(apiLines[0].purchaseAmount).toBe(219_600_000);
    expect(apiLines[0].selectedAmount).toBe(222_656_000);
  });

  it('preserves lump-sum Excel rows where amount equals unitPrice instead of quantity * unitPrice', () => {
    const drafts = fromPreviewLines([
      {
        rowNumber: 3,
        lineNo: 1,
        isValid: true,
        lineType: 'material',
        materialCode: 'VT-LUMP-SUM',
        productName: 'Vật tư phụ kiện trọn gói',
        unit: 'Bộ',
        quantity: 60,
        proposalUnitPrice: 1_345_300,
        proposalAmount: 1_345_300,
        quotes: [],
      },
    ]);

    const apiLines = toApiLines(drafts);
    expect(apiLines[0].proposalAmount).toBe(1_345_300);
  });

  it('keeps blank Excel amounts as null even when unitPrice is populated', () => {
    const drafts = fromPreviewLines([
      {
        rowNumber: 4,
        lineNo: 1,
        isValid: true,
        lineType: 'material',
        materialCode: 'VT-BLANK-AMT',
        productName: 'Thép tấm chưa chốt thành tiền',
        unit: 'Tấm',
        quantity: 5,
        kgPerUnit: 200,
        proposalUnitPrice: 26_818.18,
        proposalAmount: null,
        quotes: [],
      },
    ]);

    const apiLines = toApiLines(drafts);
    expect(apiLines[0].proposalUnitPrice).toBe(26_818.18);
    expect(apiLines[0].proposalAmount).toBeNull();
  });

  it('preserves explicit zero (0) Excel amounts without coercing to null', () => {
    const drafts = fromPreviewLines([
      {
        rowNumber: 5,
        lineNo: 1,
        isValid: true,
        lineType: 'material',
        materialCode: 'VT-ZERO-AMT',
        productName: 'Vật tư cấp miễn phí',
        unit: 'Cái',
        quantity: 10,
        budgetUnitPrice: 0,
        budgetAmount: 0,
        quotes: [],
      },
    ]);

    expect(resolveDraftStageAmount(drafts[0], 'budget')).toBe(0);
    const apiLines = toApiLines(drafts);
    expect(apiLines[0].budgetAmount).toBe(0);
  });

  it('preserves stored amounts and quote fields verbatim on edit round-trip', () => {
    const existing: PurchasePlanLineApiDto[] = [
      {
        id: 88,
        lineNo: 1,
        lineType: 'material',
        materialCode: 'VT-INOX-304',
        productName: 'Tấm Inox 304 dày 10mm',
        unit: 'Tấm',
        quantity: 16,
        kgPerUnit: 194,
        budgetUnitPrice: 928_000,
        budgetAmount: 180_032_000,
        proposalKgPerUnit: 194,
        proposalUnitPrice: 13_916_000,
        proposalAmount: 222_656_000,
        purchaseKgPerUnit: 194,
        purchaseUnitPrice: 13_725_000,
        purchaseAmount: 219_600_000,
        selectedUnitPrice: 13_916_000,
        selectedAmount: 222_656_000,
        orderedQty: 0,
        receivedQty: 0,
        defectQty: 0,
        remainingOrderableQty: 16,
        quotes: [
          {
            id: 1,
            sortOrder: 1,
            kgPerUnit: 194,
            unitPrice: 13_916_000,
            amount: 222_656_000,
            supplierName: 'Công ty Inox Nam Phát',
            note: 'Báo giá trọn lô',
            status: 'Đã chọn',
          },
        ],
      },
    ];

    const apiLines = toApiLines(fromExistingPlanLines(existing));
    expect(apiLines[0].budgetAmount).toBe(180_032_000);
    expect(apiLines[0].proposalAmount).toBe(222_656_000);
    expect(apiLines[0].purchaseAmount).toBe(219_600_000);
    expect(apiLines[0].selectedAmount).toBe(222_656_000);
    expect(apiLines[0].quotes).toEqual([
      {
        sortOrder: 1,
        kgPerUnit: 194,
        unitPrice: 13_916_000,
        amount: 222_656_000,
        supplierName: 'Công ty Inox Nam Phát',
        note: 'Báo giá trọn lô',
        status: 'Đã chọn',
      },
    ]);
  });

  it('keeps manual creation unlocked and computes dynamically via lineAmount', () => {
    const line = {
      ...emptyLine(),
      materialCode: 'VT-MANUAL',
      productName: 'Thép tấm A515',
      unit: 'Tấm',
      quantity: '2',
      kgPerUnit: '1000',
      budgetUnitPrice: '25000',
    };

    expect(line.lockBudgetAmount).toBe(false);
    expect(line.lockProposalAmount).toBe(false);
    expect(line.lockPurchaseAmount).toBe(false);
    expect(line.lockSelectedAmount).toBe(false);
    expect(resolveDraftStageAmount(line, 'budget')).toBe(50_000_000);
    expect(toApiLines([line])[0].budgetAmount).toBe(50_000_000);
  });

  it('ensures modal form and lines table resolve stage amounts via resolveDraftStageAmount', () => {
    const formPath = path.resolve(currentDir, '../../components/purchasing/useCreatePurchasePlanForm.ts');
    const tablePath = path.resolve(currentDir, '../../components/purchasing/PurchasePlanCreateLinesTable.tsx');
    const formContent = fs.readFileSync(formPath, 'utf-8');
    const tableContent = fs.readFileSync(tablePath, 'utf-8');

    expect(formContent).toContain('resolveDraftStageAmount');
    expect(formContent).not.toMatch(/\blineAmount\(/);
    expect(tableContent).toContain('resolveDraftStageAmount');
    expect(tableContent).not.toMatch(/\blineAmount\(/);
  });

  it('enforces stage-isolated Web formula (SL × ĐG when stage KG empty, SL × KG × ĐG when > 0, never stealing Dự toán KG)', () => {
    const drafts = fromPreviewLines([
      {
        rowNumber: 2,
        lineNo: 1,
        isValid: true,
        lineType: 'material',
        materialCode: 'VT-INOX-304',
        productName: 'Tấm Inox 304 dày 10mm',
        unit: 'Tấm',
        quantity: 16,
        kgPerUnit: 194,
        budgetUnitPrice: 58_000,
        budgetAmount: 180_032_000,
        proposalKgPerUnit: null,
        proposalUnitPrice: 13_916_000,
        proposalAmount: 222_656_000,
        purchaseKgPerUnit: null,
        purchaseUnitPrice: 13_725_000,
        purchaseAmount: 219_600_000,
        selectedUnitPrice: 13_916_000,
        selectedAmount: 222_656_000,
        quotes: [],
      },
    ]);

    // Web formula must NEVER multiply proposal/purchase/selected by budget's kgPerUnit (194)
    expect(computeWebStageAmount(drafts[0], 'budget')).toBe(180_032_000);
    expect(computeWebStageAmount(drafts[0], 'proposal')).toBe(222_656_000);
    expect(computeWebStageAmount(drafts[0], 'purchase')).toBe(219_600_000);
    expect(computeWebStageAmount(drafts[0], 'selected')).toBe(222_656_000);

    expect(resolveDraftStageAmount(drafts[0], 'budget', 'web')).toBe(180_032_000);
    expect(resolveDraftStageAmount(drafts[0], 'proposal', 'web')).toBe(222_656_000);
    expect(resolveDraftStageAmount(drafts[0], 'purchase', 'web')).toBe(219_600_000);
    expect(resolveDraftStageAmount(drafts[0], 'selected', 'web')).toBe(222_656_000);

    const webApiLines = toApiLines(drafts, 'web');
    expect(webApiLines[0].budgetAmount).toBe(180_032_000);
    expect(webApiLines[0].proposalAmount).toBe(222_656_000);
    expect(webApiLines[0].purchaseAmount).toBe(219_600_000);
    expect(webApiLines[0].selectedAmount).toBe(222_656_000);

    const reportMatched = buildPurchasePlanReconciliation(drafts);
    expect(reportMatched.hasMismatch).toBe(false);

    // When Excel multiplied proposal by budget kgPerUnit (194) despite blank proposalKgPerUnit,
    // Excel mode preserves 180_032_000 verbatim while Web mode uses 16 * 58_000 = 928_000 and reconciliation flags it
    const mismatchDrafts = fromPreviewLines([
      {
        rowNumber: 3,
        lineNo: 2,
        isValid: true,
        lineType: 'material',
        materialCode: 'VT-STEEL-GAP',
        productName: 'Thép tấm thiếu KG đề xuất',
        unit: 'Tấm',
        quantity: 16,
        kgPerUnit: 194,
        budgetUnitPrice: 58_000,
        budgetAmount: 180_032_000,
        proposalKgPerUnit: null,
        proposalUnitPrice: 58_000,
        proposalAmount: 180_032_000,
        quotes: [],
      },
    ]);

    expect(resolveDraftStageAmount(mismatchDrafts[0], 'proposal', 'excel')).toBe(180_032_000);
    expect(resolveDraftStageAmount(mismatchDrafts[0], 'proposal', 'web')).toBe(928_000);

    const reportMismatch = buildPurchasePlanReconciliation(mismatchDrafts);
    expect(reportMismatch.hasMismatch).toBe(true);
    expect(reportMismatch.mismatchedRowCount).toBe(1);
    expect(reportMismatch.mismatches[0].stage).toBe('proposal');
    expect(reportMismatch.mismatches[0].reason).toBe(
      'Thiếu KG/ĐVT của nhóm này trong Excel (đang trống nên Web tính SL × ĐG)',
    );
  });
});
