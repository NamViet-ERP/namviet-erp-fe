import { newMasterId, upsertById, removeById } from './masterData';

export const CSKH_DEPARTMENTS = [
  { id: 'tech', label: 'Phòng Kỹ thuật' },
  { id: 'acc', label: 'Phòng Kế toán' },
  { id: 'sales', label: 'Phòng Kinh doanh' },
  { id: 'ops', label: 'Phòng Vận hành' },
] as const;

export const CSKH_CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'zalo', label: 'Zalo' },
  { id: 'direct', label: 'Trực tiếp' },
  { id: 'courier', label: 'Chuyển phát' },
] as const;

export const CSKH_DRAFT_STAGES = [
  { id: 'draft', label: 'Soạn thảo' },
  { id: 'confirm', label: 'Chờ xác nhận nội dung' },
  { id: 'sign', label: 'Chờ trình ký' },
  { id: 'signed', label: 'Đã ký' },
  { id: 'sent', label: 'Đã gửi đi' },
  { id: 'archive', label: 'Lưu trữ' },
] as const;

export type CskhDraftStage = (typeof CSKH_DRAFT_STAGES)[number]['id'];
export type CskhHandoverDirection = 'out' | 'in';
export type CskhFeedbackFilter = 'all' | 'dueSoon' | 'overdue' | 'resubmit' | 'done';
export type CskhHandoverFilter = 'all' | 'signed' | 'unsigned' | 'unconfirmed';
export type CskhArchiveFilter = 'all' | 'valid' | 'pending' | 'expired';

export interface CskhDocProcess {
  id: string;
  name: string;
  departmentId: string;
  notes?: string;
  active: boolean;
  order: number;
}

export interface CskhDraftDoc {
  id: string;
  name: string;
  processId: string;
  author: string;
  channel: string;
  confirmDeadline?: string;
  stage: CskhDraftStage;
}

export interface CskhHandover {
  id: string;
  name: string;
  direction: CskhHandoverDirection;
  from: string;
  to: string;
  channel: string;
  at: string;
  signed: boolean;
  confirmed: boolean;
  fileUploaded: boolean;
  noFileReason?: string;
  originalCode?: string;
}

export interface CskhFeedbackItem {
  id: string;
  name: string;
  notes?: string;
  originalCode?: string;
  departmentId: string;
  sentDate: string;
  dueDate: string;
  submitCount: number;
  done: boolean;
}

export type CskhUnifiedStage = 'draft_review' | 'handover_signed' | 'feedback_pending' | 'approved' | 'archived';
export type CskhUnifiedStatus = 'drafting' | 'pending_handover' | 'overdue' | 'awaiting_client' | 'approved';

export interface CskhUnifiedDoc {
  id: string;
  code: string;
  name: string;
  docType: string;
  stage: CskhUnifiedStage;
  author?: string;
  internalApproved: boolean;
  handoverSigned: boolean;
  handoverDate?: string | null;
  handoverRecipient?: string | null;
  slaDueDate?: string;
  overdueDays: number;
  status: CskhUnifiedStatus;
  statusLabel: string;
  category?: string;
  fileSize?: string;
  fileName?: string;
  downloadUrl?: string | null;
}

export function applyDynamicSla(doc: CskhUnifiedDoc, now = Date.now()): CskhUnifiedDoc {
  // 1. Hồ sơ đã duyệt hoặc đã lưu trữ hoàn công: Không bao giờ tính trễ
  if (doc.stage === 'approved' || doc.stage === 'archived' || doc.status === 'approved') {
    return {
      ...doc,
      overdueDays: 0,
      status: 'approved',
      statusLabel: doc.statusLabel || 'Đã chấp thuận chính thức',
    };
  }

  // 2. Nếu không thiết lập ngày SLA
  if (!doc.slaDueDate) {
    return {
      ...doc,
      overdueDays: 0,
    };
  }

  // 3. Tính toán chênh lệch ngày giữa hôm nay và SlaDueDate (Zero-out giờ/phút/giây để tính đúng số ngày lịch)
  const dueDate = new Date(doc.slaDueDate);
  dueDate.setHours(0, 0, 0, 0);
  const nowDate = new Date(now);
  nowDate.setHours(0, 0, 0, 0);

  const diffMs = nowDate.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays > 0) {
    // Đã quá hạn
    const isGenericOrOverdue = !doc.statusLabel 
      || doc.statusLabel.startsWith('Quá hạn SLA') 
      || doc.statusLabel.includes('Chờ') 
      || doc.status === 'drafting';

    return {
      ...doc,
      overdueDays: diffDays,
      status: 'overdue',
      statusLabel: isGenericOrOverdue ? `Quá hạn SLA ${diffDays} ngày` : doc.statusLabel,
    };
  }

  // 4. Chưa quá hạn
  return {
    ...doc,
    overdueDays: 0,
    status: doc.status === 'overdue' ? 'awaiting_client' : doc.status,
  };
}

export interface CskhProjectDocs {
  processes: CskhDocProcess[];
  drafts: CskhDraftDoc[];
  handovers: CskhHandover[];
  feedback: CskhFeedbackItem[];
  unifiedDocs: CskhUnifiedDoc[];
}

export interface CskhDocsStore {
  byProject: Record<string, CskhProjectDocs>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function emptyProjectDocs(_projectCode?: string): CskhProjectDocs {
  return {
    processes: [],
    drafts: [],
    handovers: [],
    feedback: [],
    unifiedDocs: [],
  };
}

export function departmentLabel(id: string): string {
  return CSKH_DEPARTMENTS.find(item => item.id === id)?.label ?? id;
}

export function channelLabel(id: string): string {
  return CSKH_CHANNELS.find(item => item.id === id)?.label ?? id;
}

export function stageLabel(id: string): string {
  return CSKH_DRAFT_STAGES.find(item => item.id === id)?.label ?? id;
}

export function nextProcessOrder(processes: CskhDocProcess[]): number {
  return (processes.reduce((max, row) => Math.max(max, row.order), 0) || 0) + 1;
}

export function newDocsId(): string {
  return newMasterId();
}

export function upsertProcess(docs: CskhProjectDocs, item: CskhDocProcess): CskhProjectDocs {
  return { ...docs, processes: upsertById(docs.processes, item) };
}

export function removeProcess(docs: CskhProjectDocs, id: string): CskhProjectDocs {
  return {
    ...docs,
    processes: removeById(docs.processes, id),
    drafts: docs.drafts.filter(row => row.processId !== id),
  };
}

export function upsertDraft(docs: CskhProjectDocs, item: CskhDraftDoc): CskhProjectDocs {
  return { ...docs, drafts: upsertById(docs.drafts, item) };
}

export function moveDraft(docs: CskhProjectDocs, id: string, stage: CskhDraftStage): CskhProjectDocs {
  return {
    ...docs,
    drafts: docs.drafts.map(row => (row.id === id ? { ...row, stage } : row)),
  };
}

export function removeDraft(docs: CskhProjectDocs, id: string): CskhProjectDocs {
  return { ...docs, drafts: removeById(docs.drafts, id) };
}

export function upsertHandover(docs: CskhProjectDocs, item: CskhHandover): CskhProjectDocs {
  return { ...docs, handovers: upsertById(docs.handovers, item) };
}

export function removeHandover(docs: CskhProjectDocs, id: string): CskhProjectDocs {
  return { ...docs, handovers: removeById(docs.handovers, id) };
}

export function upsertFeedback(docs: CskhProjectDocs, item: CskhFeedbackItem): CskhProjectDocs {
  return { ...docs, feedback: upsertById(docs.feedback, item) };
}

export function removeFeedback(docs: CskhProjectDocs, id: string): CskhProjectDocs {
  return { ...docs, feedback: removeById(docs.feedback, id) };
}

export function isDeadlineOverdue(iso: string | undefined, now: number): boolean {
  if (!iso) return false;
  const due = Date.parse(iso);
  return Number.isFinite(due) && due < now;
}

export function draftKpis(drafts: CskhDraftDoc[], now = Date.now()) {
  return {
    processing: drafts.filter(row => row.stage === 'draft' || row.stage === 'confirm' || row.stage === 'sign').length,
    waiting: drafts.filter(row => row.stage === 'confirm').length,
    overdue: drafts.filter(row => row.stage === 'confirm' && isDeadlineOverdue(row.confirmDeadline, now)).length,
    ready: drafts.filter(row => row.stage === 'signed').length,
  };
}

export function handoverKpis(rows: CskhHandover[]) {
  const outgoing = rows.filter(row => row.direction === 'out');
  const incoming = rows.filter(row => row.direction === 'in');
  return {
    outgoing: outgoing.length,
    incoming: incoming.length,
    unsigned: rows.filter(row => !row.signed).length,
    unconfirmed: rows.filter(row => !row.confirmed).length,
  };
}

export function filterHandovers(
  rows: CskhHandover[],
  direction: CskhHandoverDirection,
  filter: CskhHandoverFilter,
): CskhHandover[] {
  return rows.filter(row => {
    if (row.direction !== direction) return false;
    if (filter === 'signed') return row.signed;
    if (filter === 'unsigned') return !row.signed;
    if (filter === 'unconfirmed') return !row.confirmed;
    return true;
  });
}

export function feedbackStatus(
  row: CskhFeedbackItem,
  now = Date.now(),
): 'done' | 'overdue' | 'dueSoon' | 'open' {
  if (row.done) return 'done';
  const due = Date.parse(row.dueDate);
  if (Number.isFinite(due) && due < now) return 'overdue';
  if (Number.isFinite(due) && due >= now && due <= now + 5 * DAY_MS) return 'dueSoon';
  return 'open';
}

export function feedbackKpis(rows: CskhFeedbackItem[], now = Date.now()) {
  return {
    waiting: rows.filter(row => !row.done).length,
    dueSoon: rows.filter(row => feedbackStatus(row, now) === 'dueSoon').length,
    overdue: rows.filter(row => feedbackStatus(row, now) === 'overdue').length,
    resubmit: rows.filter(row => !row.done && row.submitCount >= 2).length,
    done: rows.filter(row => row.done).length,
  };
}

export function filterFeedback(
  rows: CskhFeedbackItem[],
  filter: CskhFeedbackFilter,
  now = Date.now(),
): CskhFeedbackItem[] {
  return rows.filter(row => {
    const status = feedbackStatus(row, now);
    if (filter === 'dueSoon') return status === 'dueSoon';
    if (filter === 'overdue') return status === 'overdue';
    if (filter === 'resubmit') return !row.done && row.submitCount >= 2;
    if (filter === 'done') return row.done;
    return true;
  });
}

export function filterArchive(drafts: CskhDraftDoc[], filter: CskhArchiveFilter, now = Date.now()): CskhDraftDoc[] {
  return drafts.filter(row => {
    if (filter === 'valid') return row.stage === 'archive';
    if (filter === 'pending') return row.stage === 'sign';
    if (filter === 'expired') {
      return row.stage !== 'archive' && isDeadlineOverdue(row.confirmDeadline, now);
    }
    return row.stage === 'signed' || row.stage === 'sent' || row.stage === 'archive' || row.stage === 'sign';
  });
}

export function archiveKpis(drafts: CskhDraftDoc[], now = Date.now()) {
  const visible = filterArchive(drafts, 'all', now);
  return {
    total: visible.filter(row => row.stage === 'archive' || row.stage === 'signed' || row.stage === 'sent').length,
    valid: drafts.filter(row => row.stage === 'archive').length,
    pending: drafts.filter(row => row.stage === 'sign').length,
    expiring: drafts.filter(row => row.stage !== 'archive' && isDeadlineOverdue(row.confirmDeadline, now)).length,
  };
}

export function unifiedDocsKpis(docs: CskhUnifiedDoc[] = []) {
  const normalizedDocs = docs.map(d => applyDynamicSla(d));
  const activeDocs = normalizedDocs.filter(d => d.stage !== 'archived');
  const internalReview = activeDocs.filter(d => d.stage === 'draft_review').length;
  const handoverSigned = activeDocs.filter(d => d.handoverSigned || d.stage === 'handover_signed').length;
  const slaOverdue = activeDocs.filter(d => d.status === 'overdue' || (d.overdueDays != null && d.overdueDays > 0)).length;
  const approved = activeDocs.filter(d => d.stage === 'approved').length;

  return {
    total: activeDocs.length,
    internalReview,
    handoverSigned,
    slaOverdue,
    approved,
  };
}

export type CskhUnifiedDocFilter = 'all' | 'draft' | 'handover' | 'feedback' | 'overdue' | 'approved';

export function filterUnifiedDocs(docs: CskhUnifiedDoc[] = [], filter: CskhUnifiedDocFilter = 'all'): CskhUnifiedDoc[] {
  const normalizedDocs = docs.map(d => applyDynamicSla(d));
  const nonArchived = normalizedDocs.filter(d => d.stage !== 'archived');
  return nonArchived.filter(d => {
    if (filter === 'draft') return d.stage === 'draft_review';
    if (filter === 'handover') return d.stage === 'handover_signed';
    if (filter === 'feedback') return d.stage === 'feedback_pending';
    if (filter === 'overdue') return d.status === 'overdue' || (d.overdueDays != null && d.overdueDays > 0);
    if (filter === 'approved') return d.stage === 'approved';
    return true;
  });
}

export function upsertUnifiedDoc(docs: CskhProjectDocs, item: CskhUnifiedDoc): CskhProjectDocs {
  const existing = docs.unifiedDocs ?? [];
  return {
    ...docs,
    unifiedDocs: upsertById(existing, item),
  };
}

export function removeUnifiedDoc(docs: CskhProjectDocs, id: string): CskhProjectDocs {
  return {
    ...docs,
    unifiedDocs: removeById(docs.unifiedDocs ?? [], id),
  };
}

export type CskhArchiveCategoryFilter = 'all' | 'acceptance' | 'cocq' | 'asbuilt' | 'warranty';

export function archiveOverviewKpis(docs: CskhUnifiedDoc[] = []) {
  const archiveDocs = docs.filter(d => d.stage === 'archived' || d.stage === 'approved');
  const asbuiltAndCocq = archiveDocs.filter(
    d => d.category?.includes('As-built') || d.category?.includes('CO/CQ') || d.docType?.includes('As-built') || d.docType?.includes('CO/CQ')
  ).length;

  return {
    totalArchived: archiveDocs.length,
    asbuiltAndCocq,
    warrantyMonthsRemaining: 42, // Countdown 42/48 months
  };
}

export function filterArchiveDocs(docs: CskhUnifiedDoc[] = [], filter: CskhArchiveCategoryFilter = 'all'): CskhUnifiedDoc[] {
  const archiveDocs = docs.filter(d => d.stage === 'archived' || d.stage === 'approved');
  return archiveDocs.filter(d => {
    const cat = (d.category || '').toLowerCase();
    const dt = (d.docType || '').toLowerCase();
    if (filter === 'acceptance') return cat.includes('nghiệm thu') || dt.includes('nghiệm thu');
    if (filter === 'cocq') return cat.includes('co/cq') || dt.includes('co/cq') || cat.includes('xuất xưởng') || dt.includes('xuất xưởng');
    if (filter === 'asbuilt') return cat.includes('as-built') || dt.includes('as-built') || cat.includes('hoàn công') || dt.includes('hoàn công');
    if (filter === 'warranty') return cat.includes('vận hành') || dt.includes('vận hành') || cat.includes('bảo dưỡng') || dt.includes('bảo dưỡng') || cat.includes('48t');
    return true;
  });
}

/**
 * Phân định class màu sắc ngữ nghĩa cho loại / danh mục hồ sơ đệ trình & hoàn công
 */
export function getDocTypeTagClass(typeOrCategory?: string): string {
  const text = (typeOrCategory || '').toLowerCase();
  if (text.includes('nghiệm thu')) return 'cskh-tag--inspection';
  if (text.includes('vật tư')) return 'cskh-tag--material';
  if (text.includes('thiết bị')) return 'cskh-tag--equipment';
  if (text.includes('thi công') || text.includes('phương án') || text.includes('kỹ thuật')) return 'cskh-tag--submission';
  if (text.includes('co/cq') || text.includes('xuất xưởng')) return 'cskh-tag--cocq';
  if (text.includes('as-built') || text.includes('hoàn công') || text.includes('bản vẽ')) return 'cskh-tag--asbuilt';
  if (text.includes('vận hành') || text.includes('bảo dưỡng') || text.includes('48t')) return 'cskh-tag--operation';
  return 'cskh-tag--default';
}

