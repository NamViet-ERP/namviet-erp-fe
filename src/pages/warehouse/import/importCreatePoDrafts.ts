import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';

export type PoLineDraft = {
  selected: boolean;
  qty: string;
};

export function defaultPoLineDrafts(lines: PoImportLinePreviewApiDto[]): Record<number, PoLineDraft> {
  const next: Record<number, PoLineDraft> = {};
  for (const line of lines) {
    const available = Number(line.available) || 0;
    next[line.poItemId] = {
      selected: available > 0,
      qty: available > 0 ? String(available) : '0',
    };
  }
  return next;
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
      const qty = Math.min(Number(existing.qty) || 0, line.available);
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
