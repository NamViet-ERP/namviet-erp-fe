import type { Import, ImportItem } from '../../../types';

export type ReceiveLineDraft = {
  lineId: number;
  planned: number;
  /** SL thực tế (= Đạt vào tồn). Mặc định = SL lúc tạo phiếu. */
  accepted: string;
  defect: string;
  shortage: string;
  /** Lý do khi trừ SL (lỗi và/hoặc thiếu) trên dòng này. */
  lineReason: string;
};

export type ImportApproveSettlementPayload = {
  evaluation: string;
  shortageReport: string;
  defectReason: string;
  lines: Array<{
    lineId: number;
    acceptedQty: number;
    defectQty: number;
    shortageQty: number;
    defectLineReason?: string | null;
    shortageLineReason?: string | null;
  }>;
};

function plannedOf(item: ImportItem): number {
  const planned = Number(item.plannedQty);
  if (Number.isFinite(planned) && planned > 0) return planned;
  return Number(item.qty) || 0;
}

function lineIdOf(item: ImportItem): number | null {
  const id = Number(item.lineId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function buildReceiveLineDrafts(items: ImportItem[]): ReceiveLineDraft[] {
  return items.map(item => {
    const planned = plannedOf(item);
    const lineId = lineIdOf(item) ?? 0;
    // SL thực tế luôn seed = SL tạo phiếu (dự kiến).
    return {
      lineId,
      planned,
      accepted: String(planned),
      defect: '0',
      shortage: '0',
      lineReason: '',
    };
  });
}

function parseQty(raw: string): number {
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/** Khi đổi SL thực tế hoặc Lỗi → tự tính Thiếu = dự kiến − thực tế − lỗi (≥ 0). */
export function recomputeShortage(
  draft: ReceiveLineDraft,
  field: 'accepted' | 'defect',
  value: string,
): ReceiveLineDraft {
  const next = { ...draft, [field]: value };
  const accepted = parseQty(next.accepted);
  const defect = parseQty(next.defect);
  if (!Number.isFinite(accepted) || !Number.isFinite(defect)) {
    return next;
  }
  const shortage = Math.max(0, Math.round((draft.planned - accepted - defect) * 10000) / 10000);
  return { ...next, shortage: String(shortage) };
}

export function lineNeedsReason(draft: ReceiveLineDraft): boolean {
  const defect = parseQty(draft.defect);
  const shortage = parseQty(draft.shortage);
  return (Number.isFinite(defect) && defect > 0) || (Number.isFinite(shortage) && shortage > 0);
}

/** Dòng có Lỗi/Thiếu nhưng chưa nhập lý do - dùng highlight + scroll. */
export function missingReasonLineIds(drafts: ReceiveLineDraft[]): number[] {
  return drafts
    .filter(d => lineNeedsReason(d) && !d.lineReason.trim())
    .map(d => d.lineId);
}

export function validateReceiveSettlement(
  drafts: ReceiveLineDraft[],
  shortageReport: string,
  hasDefectPhoto: boolean,
  hasPo: boolean,
): string | null {
  if (drafts.some(d => !d.lineId)) {
    return 'Thiếu mã dòng phiếu - tải lại chi tiết phiếu rồi thử duyệt.';
  }

  let totalDefect = 0;
  let totalShortage = 0;

  for (const d of drafts) {
    const accepted = parseQty(d.accepted);
    const defect = parseQty(d.defect);
    const shortage = parseQty(d.shortage);
    if (![accepted, defect, shortage].every(n => Number.isFinite(n) && n >= 0)) {
      return 'SL thực tế / Lỗi / Thiếu phải là số ≥ 0.';
    }
    if (Math.abs(accepted + defect + shortage - d.planned) > 0.0001) {
      return `SL thực tế + Lỗi + Thiếu phải bằng SL tạo phiếu (${d.planned}).`;
    }
    if (lineNeedsReason(d) && !d.lineReason.trim()) {
      return 'Mỗi dòng bị trừ SL (lỗi hoặc thiếu) cần lý do trên dòng.';
    }
    totalDefect += defect;
    totalShortage += shortage;
  }

  if (totalShortage > 0 && !shortageReport.trim()) {
    return 'Có hàng thiếu - bắt buộc nhập báo cáo thiếu hàng.';
  }
  if (totalDefect > 0) {
    if (!hasPo) return 'Hàng lỗi chỉ hỗ trợ phiếu nhập gắn PO.';
    if (!hasDefectPhoto) return 'Có hàng lỗi - cần ít nhất 1 ảnh hàng lỗi.';
  }

  return null;
}

export function toApproveSettlementPayload(
  drafts: ReceiveLineDraft[],
  evaluation: string,
  shortageReport: string,
  defectReason: string,
): ImportApproveSettlementPayload {
  return {
    evaluation,
    shortageReport: shortageReport.trim(),
    defectReason: defectReason.trim(),
    lines: drafts.map(d => {
      const defect = parseQty(d.defect);
      const shortage = parseQty(d.shortage);
      const reason = d.lineReason.trim() || null;
      return {
        lineId: d.lineId,
        acceptedQty: parseQty(d.accepted),
        defectQty: defect,
        shortageQty: shortage,
        defectLineReason: defect > 0 ? reason : null,
        shortageLineReason: shortage > 0 ? reason : null,
      };
    }),
  };
}

export function settlementTotals(drafts: ReceiveLineDraft[]) {
  return drafts.reduce(
    (acc, d) => {
      acc.accepted += parseQty(d.accepted) || 0;
      acc.defect += parseQty(d.defect) || 0;
      acc.shortage += parseQty(d.shortage) || 0;
      return acc;
    },
    { accepted: 0, defect: 0, shortage: 0 },
  );
}

export function hasPoReference(imp: Import): boolean {
  return Boolean(imp.referenceCode?.trim());
}
