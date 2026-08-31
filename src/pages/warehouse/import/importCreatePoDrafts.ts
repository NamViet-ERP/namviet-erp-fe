import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';

export type PoLineDraft = {
  selected: boolean;
  qty: string;
};

export type PoLineQtyCap = (line: PoImportLinePreviewApiDto) => number;

export function poLineQtyCap(
  line: PoImportLinePreviewApiDto,
  getQtyCap?: PoLineQtyCap,
): number {
  if (!getQtyCap) return Number(line.available) || 0;
  const cap = getQtyCap(line);
  if (!Number.isFinite(cap)) return Number.POSITIVE_INFINITY;
  return cap > 0 ? cap : 0;
}

export function defaultPoLineDrafts(
  lines: PoImportLinePreviewApiDto[],
  getQtyCap?: PoLineQtyCap,
): Record<number, PoLineDraft> {
  const next: Record<number, PoLineDraft> = {};
  for (const line of lines) {
    const available = poLineQtyCap(line, getQtyCap);
    const usable = Number.isFinite(available) && available > 0;
    next[line.poItemId] = {
      selected: usable,
      qty: usable ? String(available) : '0',
    };
  }
  return next;
}

function clampPositiveQty(raw: number, available: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const cap = Number.isFinite(available) && available > 0 ? available : raw;
  return Math.min(raw, cap);
}

/** Dòng PO đang tick trên modal — nguồn sự thật lúc bấm Chốt / Lưu nháp. */
export function selectedPoItemsFromDrafts(
  lines: PoImportLinePreviewApiDto[],
  drafts: Record<number, PoLineDraft>,
  getQtyCap?: PoLineQtyCap,
): { poItemId: number; qty: number }[] {
  return lines.flatMap(line => {
    const draft = drafts[line.poItemId];
    if (!draft?.selected) return [];
    const available = poLineQtyCap(line, getQtyCap);
    let qty = Number(draft.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      qty = Number.isFinite(available) && available > 0 ? available : 0;
    }
    qty = clampPositiveQty(qty, Number.isFinite(available) ? available : qty);
    if (qty <= 0) return [];
    return [{ poItemId: line.poItemId, qty }];
  });
}

export function poItemsFromFormNotes(
  items: { notes?: string | null; qty?: string | number }[],
): { poItemId: number; qty: number }[] {
  return items.flatMap(line => {
    const match = /poItem:(\d+)/i.exec((line.notes ?? '').trim());
    const poItemId = match ? Number(match[1]) : NaN;
    const qty = Number(line.qty);
    if (!Number.isFinite(poItemId) || poItemId <= 0 || !Number.isFinite(qty) || qty <= 0) return [];
    return [{ poItemId, qty }];
  });
}

export function fallbackPoItemsFromPreview(
  lines: PoImportLinePreviewApiDto[],
): { poItemId: number; qty: number }[] {
  return lines.flatMap(line => {
    const qty = Number(line.available) || 0;
    if (qty <= 0) return [];
    return [{ poItemId: line.poItemId, qty }];
  });
}

/** Ưu tiên tick trên modal → ghi chú dòng form → toàn bộ SL còn lại trên preview. */
export function resolvePoImportItems(args: {
  evidencePoItems?: { poItemId: number; qty: number }[];
  formItems: { notes?: string | null; qty?: string | number }[];
  previewLines: PoImportLinePreviewApiDto[];
}): { poItemId: number; qty: number }[] {
  const fromEvidence = (args.evidencePoItems ?? []).filter(x => x.poItemId > 0 && x.qty > 0);
  if (fromEvidence.length > 0) return fromEvidence;
  const fromNotes = poItemsFromFormNotes(args.formItems);
  if (fromNotes.length > 0) return fromNotes;
  return fallbackPoItemsFromPreview(args.previewLines);
}

export function poDraftsToItems(
  lines: PoImportLinePreviewApiDto[],
  drafts: Record<number, PoLineDraft>,
): MaterialQtyPriceLine[] {
  return lines
    .filter(line => {
      const draft = drafts[line.poItemId];
      return draft?.selected && Number(draft.qty) > 0;
    })
    .map(line => {
      const draft = drafts[line.poItemId]!;
      return {
        materialCode: line.materialCode ?? '',
        materialName: line.name ?? '',
        unit: line.unit ?? '',
        qty: draft.qty,
        unitPrice: String(line.unitPrice),
        notes: `poItem:${line.poItemId}`,
      };
    });
}

function parsePoItemId(notes?: string | null): number | null {
  if (!notes) return null;
  const match = /^poItem:(\d+)$/i.exec(notes.trim());
  return match ? Number(match[1]) : null;
}

/** Khôi phục tick/SL từ dòng phiếu đang sửa (notes poItem:{id}). */
export function draftsFromExistingItems(
  lines: PoImportLinePreviewApiDto[],
  items: MaterialQtyPriceLine[],
  getQtyCap?: PoLineQtyCap,
): Record<number, PoLineDraft> {
  const byPoItem = new Map<number, MaterialQtyPriceLine>();
  for (const it of items) {
    const id = parsePoItemId(it.notes);
    if (id != null) byPoItem.set(id, it);
  }
  const next: Record<number, PoLineDraft> = {};
  for (const line of lines) {
    const existing = byPoItem.get(line.poItemId);
    if (existing) {
      const cap = poLineQtyCap(line, getQtyCap);
      const raw = Number(existing.qty) || 0;
      const qty = cap > 0 ? Math.min(raw, cap) : raw;
      next[line.poItemId] = {
        selected: qty > 0,
        qty: qty > 0 ? String(qty) : '0',
      };
    } else {
      next[line.poItemId] = { selected: false, qty: '0' };
    }
  }
  return next;
}
