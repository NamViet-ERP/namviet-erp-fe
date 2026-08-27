import { newMasterId, upsertById, removeById } from './masterData';

export const CSKH_DOCS_STORAGE_KEY = 'nv-cskh-docs-pipeline';

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

export interface CskhProjectDocs {
  processes: CskhDocProcess[];
  drafts: CskhDraftDoc[];
  handovers: CskhHandover[];
  feedback: CskhFeedbackItem[];
}

export interface CskhDocsStore {
  byProject: Record<string, CskhProjectDocs>;
}

const EMPTY_STORE: CskhDocsStore = { byProject: {} };
const DAY_MS = 24 * 60 * 60 * 1000;

export function emptyProjectDocs(): CskhProjectDocs {
  return {
    processes: [],
    drafts: [],
    handovers: [],
    feedback: [],
  };
}

export function loadDocsStore(): CskhDocsStore {
  try {
    const raw = localStorage.getItem(CSKH_DOCS_STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as CskhDocsStore;
    return { byProject: parsed.byProject ?? {} };
  } catch {
    return EMPTY_STORE;
  }
}

export function saveDocsStore(store: CskhDocsStore): void {
  localStorage.setItem(CSKH_DOCS_STORAGE_KEY, JSON.stringify(store));
}

export function projectDocs(store: CskhDocsStore, code: string): CskhProjectDocs {
  return store.byProject[code] ?? emptyProjectDocs();
}

export function patchProjectDocs(
  store: CskhDocsStore,
  code: string,
  next: CskhProjectDocs,
): CskhDocsStore {
  return {
    byProject: {
      ...store.byProject,
      [code]: next,
    },
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
