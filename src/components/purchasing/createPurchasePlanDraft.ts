import type {
  CreatePurchasePlanLineQuoteRequest,
  CreatePurchasePlanLineRequest,
  PurchasePlanImportLinePreviewApiDto,
  PurchasePlanLineApiDto,
  PurchasePlanLineType,
} from '../../types/api/purchasingApi';
import { parseCurrencyInput } from '../../utils/currencyInput';

export type { PurchasePlanLineType };

/** Trần đơn giá ngân sách (VNĐ) — tránh overflow / nhập nhầm. */
export const MAX_BUDGET_UNIT_PRICE = 1_000_000_000_000;

export type DraftAmountStage = 'budget' | 'proposal' | 'purchase' | 'selected';
export type PlanAmountSourceMode = 'excel' | 'web';

export interface DraftQuote {
  key: string;
  sortOrder: number;
  kgPerUnit?: string;
  unitPrice: string;
  supplierName: string;
  amount: string;
  note?: string;
  status?: string;
}

export interface DraftLine {
  key: string;
  excelRowNumber?: number;
  lineType: PurchasePlanLineType;
  materialCode: string;
  productName: string;
  unit: string;
  quantity: string;
  systemName: string;
  category: string;
  spec: string;
  description: string;
  lineNote: string;
  kgPerUnit: string;
  purchaseStatus: string;
  statusNote: string;
  budgetUnitPrice: string;
  budgetAmount: string;
  proposalKgPerUnit: string;
  proposalUnitPrice: string;
  proposalAmount: string;
  proposalSupplierName: string;
  proposalNote: string;
  proposalStatus: string;
  purchaseKgPerUnit: string;
  purchaseUnitPrice: string;
  purchaseAmount: string;
  purchaseSupplierName: string;
  purchaseNote: string;
  selectedUnitPrice: string;
  selectedAmount: string;
  selectedSupplierName: string;
  selectionReason: string;
  orderedDate: string;
  expectedDeliveryDate: string;
  actualReceiptDate: string;
  deliveryNote: string;
  requiredDate: string;
  lockBudgetAmount: boolean;
  lockProposalAmount: boolean;
  lockPurchaseAmount: boolean;
  lockSelectedAmount: boolean;
  quotes: DraftQuote[];
}

export function emptyLine(lineType: PurchasePlanLineType = 'material'): DraftLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    excelRowNumber: undefined,
    lineType,
    materialCode: '',
    productName: '',
    unit: '',
    quantity: '1',
    systemName: '',
    category: '',
    spec: '',
    description: '',
    lineNote: '',
    kgPerUnit: '',
    purchaseStatus: '',
    statusNote: '',
    budgetUnitPrice: '',
    budgetAmount: '',
    proposalKgPerUnit: '',
    proposalUnitPrice: '',
    proposalAmount: '',
    proposalSupplierName: '',
    proposalNote: '',
    proposalStatus: '',
    purchaseKgPerUnit: '',
    purchaseUnitPrice: '',
    purchaseAmount: '',
    purchaseSupplierName: '',
    purchaseNote: '',
    selectedUnitPrice: '',
    selectedAmount: '',
    selectedSupplierName: '',
    selectionReason: '',
    orderedDate: '',
    expectedDeliveryDate: '',
    actualReceiptDate: '',
    deliveryNote: '',
    requiredDate: '',
    lockBudgetAmount: false,
    lockProposalAmount: false,
    lockPurchaseAmount: false,
    lockSelectedAmount: false,
    quotes: [],
  };
}

export function parseNum(v: string): number | null {
  const t = v.trim().replace(/,/g, '');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function parseOptionalCurrency(v: string): number | null {
  const t = v.trim();
  if (!t || t.startsWith('-') || !/[0-9]/.test(t)) return null;
  return parseCurrencyInput(t);
}

export function lineAmount(qty: string, unitPrice: string, kgPerUnit?: string): number {
  const q = parseNum(qty) ?? 0;
  const p = parseOptionalCurrency(unitPrice) ?? 0;
  const kg = parseNum(kgPerUnit ?? '');
  if (q <= 0 || p <= 0) return 0;
  const raw = kg != null && kg > 0 ? q * kg * p : q * p;
  return Math.round(raw * 100) / 100;
}

export function currencyToDraft(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '';
  return String(Math.round(v * 100) / 100);
}

export function numToDraft(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '';
  return String(v);
}

export function isUnknownPlanItem(
  line: Pick<DraftLine, 'lineType' | 'materialCode'>,
  knownMaterialCodes?: Set<string>,
  knownServiceCodes?: Set<string>,
): boolean {
  const code = line.materialCode?.trim().toLowerCase() ?? '';
  if (!code) return false;
  const hasMaterials = Boolean(knownMaterialCodes && knownMaterialCodes.size > 0);
  const hasServices = Boolean(knownServiceCodes && knownServiceCodes.size > 0);
  if (!hasMaterials && !hasServices) return false;
  const isMaterial = (line.lineType || 'material') === 'material';
  if (isMaterial) {
    return hasMaterials
      && !knownMaterialCodes!.has(code)
      && !(knownServiceCodes?.has(code));
  }
  return hasServices
    && !knownServiceCodes!.has(code)
    && !(knownMaterialCodes?.has(code));
}

export function dateToDraft(v: string | null | undefined): string {
  if (!v) return '';
  return v.slice(0, 10);
}

export const STAGE_AMOUNT_CONFIG: Record<
  DraftAmountStage,
  {
    lockKey: 'lockBudgetAmount' | 'lockProposalAmount' | 'lockPurchaseAmount' | 'lockSelectedAmount';
    amountKey: 'budgetAmount' | 'proposalAmount' | 'purchaseAmount' | 'selectedAmount';
    priceKey: 'budgetUnitPrice' | 'proposalUnitPrice' | 'purchaseUnitPrice' | 'selectedUnitPrice';
    kgKey: 'kgPerUnit' | 'proposalKgPerUnit' | 'purchaseKgPerUnit';
  }
> = {
  budget: {
    lockKey: 'lockBudgetAmount',
    amountKey: 'budgetAmount',
    priceKey: 'budgetUnitPrice',
    kgKey: 'kgPerUnit',
  },
  proposal: {
    lockKey: 'lockProposalAmount',
    amountKey: 'proposalAmount',
    priceKey: 'proposalUnitPrice',
    kgKey: 'proposalKgPerUnit',
  },
  purchase: {
    lockKey: 'lockPurchaseAmount',
    amountKey: 'purchaseAmount',
    priceKey: 'purchaseUnitPrice',
    kgKey: 'purchaseKgPerUnit',
  },
  selected: {
    lockKey: 'lockSelectedAmount',
    amountKey: 'selectedAmount',
    priceKey: 'selectedUnitPrice',
    kgKey: 'purchaseKgPerUnit',
  },
};

/**
 * Resolves the stage-isolated KG/ĐVT string for Web formula calculation.
 * Never falls back to budget `kgPerUnit` for proposal, purchase, or selected stages.
 */
export function getWebStageKgInput(line: DraftLine, stage: DraftAmountStage): string | undefined {
  const isMaterial = (line.lineType || 'material') === 'material';
  if (!isMaterial) return undefined;
  switch (stage) {
    case 'budget':
      return line.kgPerUnit;
    case 'proposal':
      return line.proposalKgPerUnit;
    case 'purchase':
      return line.purchaseKgPerUnit;
    case 'selected':
      return line.purchaseKgPerUnit.trim() || line.proposalKgPerUnit;
  }
}

/**
 * Computes a stage amount using the Web formula (`SL × KG/ĐVT × ĐG` when stage KG/ĐVT > 0, else `SL × ĐG`).
 * Uses strict stage-isolated KG/ĐVT without inheriting budget `kgPerUnit`.
 */
export function computeWebStageAmount(line: DraftLine, stage: DraftAmountStage): number | null {
  const stageKg = getWebStageKgInput(line, stage);
  const computed = lineAmount(line.quantity, line[STAGE_AMOUNT_CONFIG[stage].priceKey], stageKg);
  return computed > 0 ? computed : null;
}

/**
 * Resolves a line's amount for a given stage.
 * In `'web'` mode, always computes via `computeWebStageAmount`.
 * In `'excel'` mode, locked (imported/existing) rows return their stored/Excel amount verbatim without recalculation;
 * unlocked (manually edited) rows compute dynamically via `computeWebStageAmount`.
 */
export function resolveDraftStageAmount(
  line: DraftLine,
  stage: DraftAmountStage,
  mode: PlanAmountSourceMode = 'excel',
): number | null {
  if (mode === 'web') {
    return computeWebStageAmount(line, stage);
  }
  const cfg = STAGE_AMOUNT_CONFIG[stage];
  if (line[cfg.lockKey]) {
    return parseOptionalCurrency(line[cfg.amountKey]);
  }
  return computeWebStageAmount(line, stage);
}

export function toApiLines(
  drafts: DraftLine[],
  mode: PlanAmountSourceMode = 'excel',
): CreatePurchasePlanLineRequest[] {
  return drafts
    .map(d => {
      const quantity = parseNum(d.quantity) ?? 0;
      const isMaterial = (d.lineType ?? 'material') === 'material';
      return {
        lineType: d.lineType || 'material',
        materialCode: d.materialCode.trim() || null,
        productName: d.productName.trim(),
        unit: d.unit.trim(),
        quantity,
        systemName: d.systemName.trim() || null,
        category: d.category.trim() || null,
        spec: d.spec.trim() || null,
        description: d.description.trim() || null,
        lineNote: d.lineNote.trim() || null,
        kgPerUnit: isMaterial ? parseNum(d.kgPerUnit) : null,
        purchaseStatus: d.purchaseStatus.trim() || null,
        statusNote: d.statusNote.trim() || null,
        budgetUnitPrice: parseOptionalCurrency(d.budgetUnitPrice),
        budgetAmount: resolveDraftStageAmount(d, 'budget', mode),
        proposalKgPerUnit: isMaterial ? parseNum(d.proposalKgPerUnit) : null,
        proposalUnitPrice: parseOptionalCurrency(d.proposalUnitPrice),
        proposalAmount: resolveDraftStageAmount(d, 'proposal', mode),
        proposalSupplierName: d.proposalSupplierName.trim() || null,
        proposalNote: d.proposalNote.trim() || null,
        proposalStatus: d.proposalStatus.trim() || null,
        purchaseKgPerUnit: isMaterial ? parseNum(d.purchaseKgPerUnit) : null,
        purchaseUnitPrice: parseOptionalCurrency(d.purchaseUnitPrice),
        purchaseAmount: resolveDraftStageAmount(d, 'purchase', mode),
        purchaseSupplierName: d.purchaseSupplierName.trim() || null,
        purchaseNote: d.purchaseNote.trim() || null,
        selectedUnitPrice: parseOptionalCurrency(d.selectedUnitPrice),
        selectedAmount: resolveDraftStageAmount(d, 'selected', mode),
        selectedSupplierName: d.selectedSupplierName.trim() || null,
        selectionReason: d.selectionReason.trim() || null,
        requiredDate: d.requiredDate.trim() || null,
        orderedDate: d.orderedDate.trim() || null,
        expectedDeliveryDate: d.expectedDeliveryDate.trim() || null,
        actualReceiptDate: d.actualReceiptDate.trim() || null,
        deliveryNote: d.deliveryNote.trim() || null,
        quotes: d.quotes
          .filter(
            q =>
              q.supplierName.trim()
              || parseOptionalCurrency(q.unitPrice) != null
              || parseOptionalCurrency(q.amount) != null,
          )
          .map((q, i) => {
            const mapped: CreatePurchasePlanLineQuoteRequest = {
              sortOrder: q.sortOrder || i + 1,
              unitPrice: parseOptionalCurrency(q.unitPrice),
              amount: parseOptionalCurrency(q.amount),
              supplierName: q.supplierName.trim() || null,
            };
            const quoteKg = parseNum(q.kgPerUnit ?? '');
            if (quoteKg != null) mapped.kgPerUnit = quoteKg;
            const quoteNote = q.note?.trim();
            if (quoteNote) mapped.note = quoteNote;
            const quoteStatus = q.status?.trim();
            if (quoteStatus) mapped.status = quoteStatus;
            return mapped;
          }),
      };
    })
    .filter(l => {
      const isMaterial = (l.lineType ?? 'material') === 'material';
      const hasIdentifier = isMaterial ? Boolean(l.materialCode) : Boolean(l.materialCode || l.productName);
      return hasIdentifier && l.unit && l.quantity > 0;
    });
}

type HydratableApiLine = PurchasePlanImportLinePreviewApiDto | PurchasePlanLineApiDto;

function apiLineToDraft(
  l: HydratableApiLine,
  key: string,
  quoteKeyPrefix: string,
  quantity: number,
  excelRowNumber?: number,
): DraftLine {
  const lineType: PurchasePlanLineType =
    l.lineType === 'service' || l.lineType === 'expense' ? l.lineType : 'material';
  const isMaterial = lineType === 'material';
  return {
    key,
    excelRowNumber,
    lineType,
    materialCode: l.materialCode ?? '',
    productName: l.productName ?? '',
    unit: l.unit ?? '',
    quantity: String(quantity),
    systemName: l.systemName ?? '',
    category: l.category ?? '',
    spec: l.spec ?? '',
    description: l.description ?? '',
    lineNote: l.lineNote ?? '',
    kgPerUnit: isMaterial ? numToDraft(l.kgPerUnit) : '',
    purchaseStatus: l.purchaseStatus ?? '',
    statusNote: l.statusNote ?? '',
    budgetUnitPrice: currencyToDraft(l.budgetUnitPrice),
    budgetAmount: currencyToDraft(l.budgetAmount),
    proposalKgPerUnit: isMaterial ? numToDraft(l.proposalKgPerUnit) : '',
    proposalUnitPrice: currencyToDraft(l.proposalUnitPrice),
    proposalAmount: currencyToDraft(l.proposalAmount),
    proposalSupplierName: l.proposalSupplierName ?? '',
    proposalNote: l.proposalNote ?? '',
    proposalStatus: l.proposalStatus ?? '',
    purchaseKgPerUnit: isMaterial ? numToDraft(l.purchaseKgPerUnit) : '',
    purchaseUnitPrice: currencyToDraft(l.purchaseUnitPrice),
    purchaseAmount: currencyToDraft(l.purchaseAmount),
    purchaseSupplierName: l.purchaseSupplierName ?? '',
    purchaseNote: l.purchaseNote ?? '',
    selectedUnitPrice: currencyToDraft(l.selectedUnitPrice),
    selectedAmount: currencyToDraft(l.selectedAmount),
    selectedSupplierName: l.selectedSupplierName ?? '',
    selectionReason: l.selectionReason ?? '',
    orderedDate: dateToDraft(l.orderedDate),
    expectedDeliveryDate: dateToDraft(l.expectedDeliveryDate),
    actualReceiptDate: dateToDraft(l.actualReceiptDate),
    deliveryNote: l.deliveryNote ?? '',
    requiredDate: dateToDraft(l.requiredDate),
    lockBudgetAmount: true,
    lockProposalAmount: true,
    lockPurchaseAmount: true,
    lockSelectedAmount: true,
    quotes: (l.quotes ?? []).map((q, qi) => ({
      key: `${quoteKeyPrefix}-${qi}`,
      sortOrder: q.sortOrder ?? qi + 1,
      kgPerUnit: numToDraft(q.kgPerUnit),
      unitPrice: currencyToDraft(q.unitPrice),
      supplierName: q.supplierName ?? '',
      amount: currencyToDraft(q.amount),
      note: q.note ?? '',
      status: q.status ?? '',
    })),
  };
}

export function fromPreviewLines(previewLines: PurchasePlanImportLinePreviewApiDto[]): DraftLine[] {
  const isServiceOrExpense = (lt?: string | null) => lt === 'service' || lt === 'expense';
  const valid = previewLines.filter(
    l => l.isValid && (isServiceOrExpense(l.lineType) ? l.productName?.trim() : l.materialCode?.trim()),
  );
  if (valid.length === 0) return [emptyLine()];
  return valid.map((l, i) =>
    apiLineToDraft(
      l,
      `import-${l.rowNumber}-${i}-${Date.now()}`,
      `q-${l.rowNumber}`,
      l.quantity > 0 ? l.quantity : 1,
      l.rowNumber,
    ),
  );
}

export function fromExistingPlanLines(lines?: PurchasePlanLineApiDto[] | null): DraftLine[] {
  if (!lines || lines.length === 0) return [emptyLine()];
  return lines.map(l => apiLineToDraft(l, `line-${l.id}`, `eq-${l.id}`, l.quantity ?? 1));
}
