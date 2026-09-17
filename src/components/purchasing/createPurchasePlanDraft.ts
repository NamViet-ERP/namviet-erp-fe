import type {
  CreatePurchasePlanLineRequest,
  PurchasePlanImportLinePreviewApiDto,
  PurchasePlanLineApiDto,
} from '../../types/api/purchasingApi';

/** Trần đơn giá ngân sách (VNĐ) — tránh overflow / nhập nhầm. */
export const MAX_BUDGET_UNIT_PRICE = 1_000_000_000_000;

export interface DraftQuote {
  key: string;
  sortOrder: number;
  unitPrice: string;
  supplierName: string;
  amount: string;
}

export interface DraftLine {
  key: string;
  materialCode: string;
  productName: string;
  unit: string;
  quantity: string;
  systemName: string;
  category: string;
  spec: string;
  lineNote: string;
  kgPerUnit: string;
  purchaseStatus: string;
  budgetUnitPrice: string;
  proposalUnitPrice: string;
  proposalSupplierName: string;
  purchaseUnitPrice: string;
  purchaseSupplierName: string;
  selectedUnitPrice: string;
  selectedSupplierName: string;
  selectionReason: string;
  expectedDeliveryDate: string;
  actualReceiptDate: string;
  requiredDate: string;
  quotes: DraftQuote[];
}

export function emptyLine(): DraftLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    materialCode: '',
    productName: '',
    unit: '',
    quantity: '1',
    systemName: '',
    category: '',
    spec: '',
    lineNote: '',
    kgPerUnit: '',
    purchaseStatus: '',
    budgetUnitPrice: '',
    proposalUnitPrice: '',
    proposalSupplierName: '',
    purchaseUnitPrice: '',
    purchaseSupplierName: '',
    selectedUnitPrice: '',
    selectedSupplierName: '',
    selectionReason: '',
    expectedDeliveryDate: '',
    actualReceiptDate: '',
    requiredDate: '',
    quotes: [],
  };
}

export function parseNum(v: string): number | null {
  const t = v.trim().replace(/,/g, '');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function lineAmount(qty: string, unitPrice: string): number {
  const q = parseNum(qty) ?? 0;
  const p = parseNum(unitPrice) ?? 0;
  return q > 0 && p > 0 ? q * p : 0;
}

export function numToDraft(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '';
  return String(v);
}

export function dateToDraft(v: string | null | undefined): string {
  if (!v) return '';
  return v.slice(0, 10);
}

export function toApiLines(drafts: DraftLine[]): CreatePurchasePlanLineRequest[] {
  return drafts
    .map(d => {
      const quantity = parseNum(d.quantity) ?? 0;
      return {
        materialCode: d.materialCode.trim(),
        productName: d.productName.trim(),
        unit: d.unit.trim(),
        quantity,
        systemName: d.systemName.trim() || null,
        category: d.category.trim() || null,
        spec: d.spec.trim() || null,
        lineNote: d.lineNote.trim() || null,
        kgPerUnit: parseNum(d.kgPerUnit),
        purchaseStatus: d.purchaseStatus.trim() || null,
        budgetUnitPrice: parseNum(d.budgetUnitPrice),
        proposalUnitPrice: parseNum(d.proposalUnitPrice),
        proposalSupplierName: d.proposalSupplierName.trim() || null,
        purchaseUnitPrice: parseNum(d.purchaseUnitPrice),
        purchaseSupplierName: d.purchaseSupplierName.trim() || null,
        selectedUnitPrice: parseNum(d.selectedUnitPrice),
        selectedSupplierName: d.selectedSupplierName.trim() || null,
        selectionReason: d.selectionReason.trim() || null,
        requiredDate: d.requiredDate.trim() || null,
        expectedDeliveryDate: d.expectedDeliveryDate.trim() || null,
        actualReceiptDate: d.actualReceiptDate.trim() || null,
        quotes: d.quotes
          .filter(q => q.supplierName.trim() || parseNum(q.unitPrice) != null)
          .map((q, i) => ({
            sortOrder: q.sortOrder || i + 1,
            unitPrice: parseNum(q.unitPrice),
            amount: parseNum(q.amount),
            supplierName: q.supplierName.trim() || null,
          })),
      };
    })
    .filter(l => l.materialCode && l.unit && l.quantity > 0);
}

export function fromPreviewLines(previewLines: PurchasePlanImportLinePreviewApiDto[]): DraftLine[] {
  const valid = previewLines.filter(l => l.isValid && l.materialCode?.trim());
  if (valid.length === 0) return [emptyLine()];
  return valid.map((l, i) => ({
    key: `import-${l.rowNumber}-${i}-${Date.now()}`,
    materialCode: l.materialCode ?? '',
    productName: l.productName ?? '',
    unit: l.unit ?? '',
    quantity: String(l.quantity > 0 ? l.quantity : 1),
    systemName: l.systemName ?? '',
    category: l.category ?? '',
    spec: l.spec ?? '',
    lineNote: l.lineNote ?? '',
    kgPerUnit: numToDraft(l.kgPerUnit),
    purchaseStatus: l.purchaseStatus ?? '',
    budgetUnitPrice: numToDraft(l.budgetUnitPrice),
    proposalUnitPrice: numToDraft(l.proposalUnitPrice),
    proposalSupplierName: l.proposalSupplierName ?? '',
    purchaseUnitPrice: numToDraft(l.purchaseUnitPrice),
    purchaseSupplierName: l.purchaseSupplierName ?? '',
    selectedUnitPrice: numToDraft(l.selectedUnitPrice),
    selectedSupplierName: l.selectedSupplierName ?? '',
    selectionReason: l.selectionReason ?? '',
    expectedDeliveryDate: dateToDraft(l.expectedDeliveryDate),
    actualReceiptDate: dateToDraft(l.actualReceiptDate),
    requiredDate: dateToDraft(l.requiredDate),
    quotes: (l.quotes ?? []).map((q, qi) => ({
      key: `q-${l.rowNumber}-${qi}`,
      sortOrder: q.sortOrder ?? qi + 1,
      unitPrice: numToDraft(q.unitPrice),
      supplierName: q.supplierName ?? '',
      amount: numToDraft(q.amount),
    })),
  }));
}

export function fromExistingPlanLines(lines?: PurchasePlanLineApiDto[] | null): DraftLine[] {
  if (!lines || lines.length === 0) return [emptyLine()];
  return lines.map(l => ({
    key: `line-${l.id}`,
    materialCode: l.materialCode ?? '',
    productName: l.productName ?? '',
    unit: l.unit ?? '',
    quantity: String(l.quantity ?? 1),
    systemName: l.systemName ?? '',
    category: l.category ?? '',
    spec: l.spec ?? '',
    lineNote: l.lineNote ?? '',
    kgPerUnit: numToDraft(l.kgPerUnit),
    purchaseStatus: l.purchaseStatus ?? '',
    budgetUnitPrice: numToDraft(l.budgetUnitPrice),
    proposalUnitPrice: numToDraft(l.proposalUnitPrice),
    proposalSupplierName: l.proposalSupplierName ?? '',
    purchaseUnitPrice: numToDraft(l.purchaseUnitPrice),
    purchaseSupplierName: l.purchaseSupplierName ?? '',
    selectedUnitPrice: numToDraft(l.selectedUnitPrice),
    selectedSupplierName: l.selectedSupplierName ?? '',
    selectionReason: l.selectionReason ?? '',
    expectedDeliveryDate: dateToDraft(l.expectedDeliveryDate),
    actualReceiptDate: dateToDraft(l.actualReceiptDate),
    requiredDate: dateToDraft(l.requiredDate),
    quotes: (l.quotes ?? []).map((q, qi) => ({
      key: `eq-${l.id}-${qi}`,
      sortOrder: q.sortOrder ?? qi + 1,
      unitPrice: numToDraft(q.unitPrice),
      supplierName: q.supplierName ?? '',
      amount: numToDraft(q.amount),
    })),
  }));
}
