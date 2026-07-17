import type {
  DocumentChecklistConfig,
  DocumentRow,
  OrderChannel,
  PurchaseOrderRow,
  PurchasingTone,
} from '../../data/purchasingMock';
import { DEFAULT_DOCUMENT_CHECKLIST } from '../../data/purchasingMock';

/** Default — chỉ còn checklist PO (không tách trong/ngoài nước). */
export const DOMESTIC_REQUIRED_DOCS = DEFAULT_DOCUMENT_CHECKLIST.domestic;
export const INTERNATIONAL_REQUIRED_DOCS = DEFAULT_DOCUMENT_CHECKLIST.domestic;

export function requiredDocsForChannel(
  _channel: OrderChannel,
  checklist?: DocumentChecklistConfig | null,
): readonly string[] {
  const cfg = checklist ?? DEFAULT_DOCUMENT_CHECKLIST;
  return cfg.domestic;
}

function normalizeType(docType: string) {
  return docType.trim().toLowerCase();
}

/** Match linh hoạt: "CO / CQ" nhận "CO", "CQ", "CO / CQ". */
export function hasDocType(presentTypes: Iterable<string>, required: string): boolean {
  const list = [...presentTypes].map(normalizeType);
  const req = normalizeType(required);

  if (req === 'co / cq' || req === 'co/cq') {
    return list.some(t => t.includes('co') || t.includes('cq') || t === 'c/o');
  }
  return list.some(t => t === req || t.includes(req));
}

export interface ChecklistStatus {
  label: string;
  tone: PurchasingTone;
  missing: string[];
  required: readonly string[];
  present: string[];
}

export function resolvePoDocumentChecklist(
  order: Pick<PurchaseOrderRow, 'id' | 'channel'> | null | undefined,
  documents: DocumentRow[],
  checklist?: DocumentChecklistConfig | null,
): ChecklistStatus {
  if (!order) {
    return {
      label: 'Chưa gắn PO',
      tone: 'neutral',
      missing: [],
      required: [],
      present: [],
    };
  }

  const required = requiredDocsForChannel(order.channel, checklist);
  const present = documents
    .filter(d => d.poId === order.id)
    .map(d => d.docType);
  const missing = required.filter(r => !hasDocType(present, r));

  if (required.length === 0) {
    return { label: 'Chưa cấu hình', tone: 'neutral', missing, required, present };
  }

  if (missing.length === 0) {
    return { label: 'Đủ', tone: 'success', missing, required, present };
  }

  return {
    label: `Thiếu ${missing.join(', ')}`,
    tone: 'warning',
    missing,
    required,
    present,
  };
}
