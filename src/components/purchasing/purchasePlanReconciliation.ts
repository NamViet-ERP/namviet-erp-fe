import {
  STAGE_AMOUNT_CONFIG,
  computeWebStageAmount,
  getWebStageKgInput,
  parseNum,
  parseOptionalCurrency,
  type DraftAmountStage,
  type DraftLine,
} from './createPurchasePlanDraft';

export const RECONCILIATION_TOLERANCE_VND = 1;

export interface StageReconciliationSummary {
  stage: DraftAmountStage;
  label: string;
  excelTotal: number;
  webTotal: number;
  diff: number;
  mismatchCount: number;
  matched: boolean;
}

export interface PlanAmountMismatch {
  lineKey: string;
  lineIndex: number;
  rowNumber: number;
  materialCode: string;
  productName: string;
  unit: string;
  stage: DraftAmountStage;
  stageLabel: string;
  quantity: number;
  stageKg: number | null;
  budgetKg: number | null;
  unitPrice: number | null;
  excelAmount: number | null;
  webAmount: number | null;
  diff: number;
  reason: string;
}

export interface PurchasePlanReconciliationReport {
  stages: StageReconciliationSummary[];
  mismatches: PlanAmountMismatch[];
  mismatchedRowCount: number;
  hasMismatch: boolean;
  totalLines: number;
}

export const RECONCILIATION_STAGES: ReadonlyArray<{ stage: DraftAmountStage; label: string }> = [
  { stage: 'budget', label: 'Dự toán' },
  { stage: 'proposal', label: 'Đề xuất' },
  { stage: 'purchase', label: 'Mua hàng' },
  { stage: 'selected', label: 'NCC chọn' },
];

function round2(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function classifyMismatchReason(params: {
  stage: DraftAmountStage;
  quantity: number;
  stageKg: number | null;
  budgetKg: number | null;
  unitPrice: number | null;
  excelAmount: number | null;
  webAmount: number | null;
}): string {
  const { stage, quantity, stageKg, budgetKg, unitPrice, excelAmount, webAmount } = params;

  if (excelAmount == null && webAmount != null) {
    return 'Excel để trống Thành tiền';
  }
  if (excelAmount != null && webAmount == null) {
    return 'Excel để trống Đơn giá';
  }
  if (
    stage !== 'budget'
    && stageKg == null
    && budgetKg != null
    && budgetKg > 0
    && unitPrice != null
    && excelAmount != null
    && Math.abs(quantity * budgetKg * unitPrice - excelAmount) <= Math.max(1000, excelAmount * 0.15)
  ) {
    return 'Thiếu KG/ĐVT của nhóm này trong Excel (đang trống nên Web tính SL × ĐG)';
  }
  if (
    unitPrice != null
    && excelAmount != null
    && quantity > 1
    && Math.abs(excelAmount - unitPrice) <= 1
  ) {
    return 'Excel nhập giá trọn gói (không nhân SL)';
  }
  return 'Thành tiền Excel khác công thức Web (SL × KG/ĐVT × ĐG hoặc SL × ĐG)';
}

export function buildPurchasePlanReconciliation(lines: DraftLine[]): PurchasePlanReconciliationReport {
  const stageTotals: Record<DraftAmountStage, { excel: number; web: number; mismatchCount: number }> = {
    budget: { excel: 0, web: 0, mismatchCount: 0 },
    proposal: { excel: 0, web: 0, mismatchCount: 0 },
    purchase: { excel: 0, web: 0, mismatchCount: 0 },
    selected: { excel: 0, web: 0, mismatchCount: 0 },
  };
  const mismatches: PlanAmountMismatch[] = [];
  const mismatchedLineKeys = new Set<string>();

  lines.forEach((line, idx) => {
    const lineIndex = idx + 1;
    const rowNumber = line.excelRowNumber ?? lineIndex;
    const isMaterial = (line.lineType || 'material') === 'material';
    const quantity = parseNum(line.quantity) ?? 0;
    const budgetKg = isMaterial ? parseNum(line.kgPerUnit) : null;

    for (const { stage, label } of RECONCILIATION_STAGES) {
      const cfg = STAGE_AMOUNT_CONFIG[stage];
      const excelAmount = parseOptionalCurrency(line[cfg.amountKey]);
      const webAmount = computeWebStageAmount(line, stage);

      stageTotals[stage].excel += excelAmount ?? 0;
      stageTotals[stage].web += webAmount ?? 0;

      const diff = round2((webAmount ?? 0) - (excelAmount ?? 0));
      if (Math.abs(diff) <= RECONCILIATION_TOLERANCE_VND) {
        continue;
      }

      const stageKgInput = getWebStageKgInput(line, stage);
      const stageKg = stageKgInput != null ? parseNum(stageKgInput) : null;
      const unitPrice = parseOptionalCurrency(line[cfg.priceKey]);

      stageTotals[stage].mismatchCount += 1;
      mismatchedLineKeys.add(line.key);

      mismatches.push({
        lineKey: line.key,
        lineIndex,
        rowNumber,
        materialCode: line.materialCode.trim(),
        productName: line.productName.trim(),
        unit: line.unit.trim(),
        stage,
        stageLabel: label,
        quantity,
        stageKg,
        budgetKg,
        unitPrice,
        excelAmount,
        webAmount,
        diff,
        reason: classifyMismatchReason({
          stage,
          quantity,
          stageKg,
          budgetKg,
          unitPrice,
          excelAmount,
          webAmount,
        }),
      });
    }
  });

  const stages: StageReconciliationSummary[] = RECONCILIATION_STAGES.map(({ stage, label }) => {
    const excelTotal = round2(stageTotals[stage].excel);
    const webTotal = round2(stageTotals[stage].web);
    const diff = round2(webTotal - excelTotal);
    const mismatchCount = stageTotals[stage].mismatchCount;
    return {
      stage,
      label,
      excelTotal,
      webTotal,
      diff,
      mismatchCount,
      matched: mismatchCount === 0,
    };
  });

  return {
    stages,
    mismatches,
    mismatchedRowCount: mismatchedLineKeys.size,
    hasMismatch: mismatches.length > 0,
    totalLines: lines.length,
  };
}
