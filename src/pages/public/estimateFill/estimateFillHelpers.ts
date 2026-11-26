import type {
  PublicPurchaseEstimateApiDto,
  SubmitPublicPurchaseEstimateRequest,
} from '../../../types/api/purchasingApi';

export type ProposalDraft = {
  key: string;
  name: string;
  spec: string;
  unit: string;
  qty: string;
  note: string;
};

export interface EstimateFillBaseline {
  preparerName: string;
  qtyByCode: Record<string, string>;
  proposals: ProposalDraft[];
}

export function groupPublicLines(row: PublicPurchaseEstimateApiDto) {
  const groups = new Map<string, PublicPurchaseEstimateApiDto['lines']>();
  for (const line of row.lines) {
    const key = line.categoryName?.trim() || 'Khác';
    const bucket = groups.get(key) ?? [];
    bucket.push(line);
    groups.set(key, bucket);
  }
  return [...groups.entries()];
}

export function buildEstimateBaseline(row: PublicPurchaseEstimateApiDto | undefined): EstimateFillBaseline {
  if (!row) return { preparerName: '', qtyByCode: {}, proposals: [] };
  const qtyByCode: Record<string, string> = {};
  for (const line of row.lines) qtyByCode[line.materialCode] = String(line.qty ?? 0);
  return {
    preparerName: row.preparerName ?? '',
    qtyByCode,
    proposals: (row.proposals ?? []).map(p => ({
      key: p.id,
      name: p.name,
      spec: p.spec ?? '',
      unit: p.unit,
      qty: String(p.qty),
      note: p.note ?? '',
    })),
  };
}

export function buildPublicEstimateSubmitBody(
  row: PublicPurchaseEstimateApiDto,
  preparerName: string,
  qtyByCode: Record<string, string>,
  readyProposals: ProposalDraft[],
): SubmitPublicPurchaseEstimateRequest {
  return {
    preparerName: preparerName.trim(),
    lines: row.lines.map(l => ({
      materialCode: l.materialCode,
      newQty: Number(qtyByCode[l.materialCode] ?? 0) || 0,
      // Form public không hiển thị giá; BE bỏ qua giá trị này khi submit public
      // (giữ đơn giá của version hiện hành), chỉ cần thỏa contract.
      estimateUnitPrice: 0,
    })),
    proposals: readyProposals.map(p => ({
      name: p.name.trim(),
      spec: p.spec.trim() || null,
      unit: p.unit.trim() || 'cái',
      qty: Number(p.qty) || 0,
      note: p.note.trim() || null,
    })),
  };
}
