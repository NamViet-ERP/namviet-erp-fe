import { describe, expect, it } from 'vitest';
import { emptyLine, fromPreviewLines } from './createPurchasePlanDraft';
import {
  RECONCILIATION_TOLERANCE_VND,
  buildPurchasePlanReconciliation,
} from './purchasePlanReconciliation';

describe('purchasePlanReconciliation', () => {
  it('reports 100% match across all 4 stages for Inox 304 (budget by KG, proposal/purchase/selected by unit) and tolerance <= 1 VND', () => {
    const drafts = fromPreviewLines([
      {
        rowNumber: 5,
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
      {
        rowNumber: 6,
        lineNo: 2,
        isValid: true,
        lineType: 'material',
        materialCode: 'VT-ROUND-1VND',
        productName: 'Thép tấm A515 làm tròn 0.6đ',
        unit: 'Tấm',
        quantity: 3,
        kgPerUnit: 1,
        budgetUnitPrice: 2_000_000.2,
        budgetAmount: 6_000_000, // web = 6_000_000.6 (diff 0.6 <= tolerance 1 VND)
        quotes: [],
      },
    ]);

    const report = buildPurchasePlanReconciliation(drafts);
    expect(RECONCILIATION_TOLERANCE_VND).toBe(1);
    expect(report.hasMismatch).toBe(false);
    expect(report.mismatchedRowCount).toBe(0);
    expect(report.mismatches).toEqual([]);
    expect(report.totalLines).toBe(2);
    expect(report.stages.map(s => s.stage)).toEqual(['budget', 'proposal', 'purchase', 'selected']);
    expect(report.stages.map(s => s.label)).toEqual(['Dự toán', 'Đề xuất', 'Mua hàng', 'NCC chọn']);
    expect(report.stages[0]).toMatchObject({
      stage: 'budget',
      label: 'Dự toán',
      excelTotal: 186_032_000,
      webTotal: 186_032_000.6,
      diff: 0.6,
      mismatchCount: 0,
      matched: true,
    });
    expect(report.stages[1].excelTotal).toBe(222_656_000);
    expect(report.stages[2].excelTotal).toBe(219_600_000);
    expect(report.stages[3].excelTotal).toBe(222_656_000);
  });

  it('classifies all 5 mismatch reasons and counts distinct mismatched rows cleanly', () => {
    const lineMissingAmountAndPrice = {
      ...emptyLine(),
      key: 'line-a',
      excelRowNumber: 10,
      materialCode: 'VT-A',
      productName: 'Ống thép A',
      unit: 'Cây',
      quantity: '5',
      budgetUnitPrice: '100000',
      budgetAmount: '', // Reason 1: Excel để trống Thành tiền (web = 500.000)
      proposalUnitPrice: '',
      proposalAmount: '450000', // Reason 2: Excel để trống Đơn giá (web = null)
    };

    const lineMissingStageKg = {
      ...emptyLine(),
      key: 'line-b',
      excelRowNumber: 14,
      materialCode: 'VT-B',
      productName: 'Thép tấm B',
      unit: 'Tấm',
      quantity: '16',
      kgPerUnit: '194',
      budgetUnitPrice: '58000',
      budgetAmount: '180032000', // matches
      proposalKgPerUnit: '', // blank stage KG
      proposalUnitPrice: '58000',
      proposalAmount: '180032000', // Reason 3: Excel multiplied by budgetKg 194, Web calculates SL * ĐG = 928.000
      purchaseKgPerUnit: '194',
      purchaseUnitPrice: '58000',
      purchaseAmount: '180032000', // matches
      selectedUnitPrice: '58000',
      selectedAmount: '180032000', // matches because selected uses purchaseKgPerUnit=194
    };

    const lineLumpSumAndOther = {
      ...emptyLine(),
      key: 'line-c',
      // No excelRowNumber -> falls back to idx + 1 = 3
      materialCode: 'VT-C',
      productName: 'Phụ kiện C',
      unit: 'Bộ',
      quantity: '60',
      budgetUnitPrice: '10000',
      budgetAmount: '750000', // Reason 5: Other (Web = 600.000, Excel = 750.000)
      proposalUnitPrice: '1345300',
      proposalAmount: '1345300', // Reason 4: Lump-sum (Excel = unitPrice while qty = 60)
    };

    const report = buildPurchasePlanReconciliation([
      lineMissingAmountAndPrice,
      lineMissingStageKg,
      lineLumpSumAndOther,
    ]);

    expect(report.hasMismatch).toBe(true);
    expect(report.mismatchedRowCount).toBe(3);
    expect(report.mismatches).toHaveLength(5);

    const byKeyStage = (key: string, stage: string) =>
      report.mismatches.find(m => m.lineKey === key && m.stage === stage);

    expect(byKeyStage('line-a', 'budget')).toMatchObject({
      rowNumber: 10,
      excelAmount: null,
      webAmount: 500_000,
      diff: 500_000,
      reason: 'Excel để trống Thành tiền',
    });

    expect(byKeyStage('line-a', 'proposal')).toMatchObject({
      rowNumber: 10,
      excelAmount: 450_000,
      webAmount: null,
      diff: -450_000,
      reason: 'Excel để trống Đơn giá',
    });

    expect(byKeyStage('line-b', 'proposal')).toMatchObject({
      rowNumber: 14,
      stageKg: null,
      budgetKg: 194,
      unitPrice: 58_000,
      excelAmount: 180_032_000,
      webAmount: 928_000,
      diff: -179_104_000,
      reason: 'Thiếu KG/ĐVT của nhóm này trong Excel (đang trống nên Web tính SL × ĐG)',
    });

    expect(byKeyStage('line-c', 'proposal')).toMatchObject({
      rowNumber: 3,
      excelAmount: 1_345_300,
      webAmount: 80_718_000,
      diff: 79_372_700,
      reason: 'Excel nhập giá trọn gói (không nhân SL)',
    });

    expect(byKeyStage('line-c', 'budget')).toMatchObject({
      rowNumber: 3,
      excelAmount: 750_000,
      webAmount: 600_000,
      diff: -150_000,
      reason: 'Thành tiền Excel khác công thức Web (SL × KG/ĐVT × ĐG hoặc SL × ĐG)',
    });
  });

  it('counts mismatchedRowCount by distinct lineKey when one line mismatches multiple stages', () => {
    const multiStageMismatchLine = {
      ...emptyLine(),
      key: 'single-line',
      excelRowNumber: 8,
      materialCode: 'VT-MULTI',
      productName: 'Van công nghiệp',
      unit: 'Cái',
      quantity: '10',
      budgetUnitPrice: '100000',
      budgetAmount: '900000',
      proposalUnitPrice: '95000',
      proposalAmount: '850000',
      purchaseUnitPrice: '90000',
      purchaseAmount: '800000',
    };

    const report = buildPurchasePlanReconciliation([multiStageMismatchLine]);
    expect(report.mismatches).toHaveLength(3);
    expect(report.mismatchedRowCount).toBe(1);
    expect(report.stages.find(s => s.stage === 'budget')?.mismatchCount).toBe(1);
    expect(report.stages.find(s => s.stage === 'proposal')?.mismatchCount).toBe(1);
    expect(report.stages.find(s => s.stage === 'purchase')?.mismatchCount).toBe(1);
    expect(report.stages.find(s => s.stage === 'selected')?.mismatchCount).toBe(0);
  });
});
