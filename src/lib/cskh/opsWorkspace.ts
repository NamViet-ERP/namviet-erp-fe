import { newMasterId, upsertById, removeById } from './masterData';
import { clampPct, progressDelta, progressStatus, type CskhProgressStatus } from './commandCenter';

export const CSKH_SEVERITIES = [
  { id: 'urgent', label: 'Khẩn cấp' },
  { id: 'medium', label: 'Trung bình' },
  { id: 'low', label: 'Thấp' },
] as const;

export type CskhSeverity = (typeof CSKH_SEVERITIES)[number]['id'];
export type CskhBottleneckStatus = 'open' | 'closed';
export type CskhBottleneckFilter = 'all' | 'urgent' | 'medium' | 'low' | 'closed';
export type CskhRequestStatus = 'open' | 'processing' | 'closed';
export type CskhRequestFilter = 'all' | 'open' | 'processing' | 'overdue' | 'closed';
export type CskhReportPeriod = 'week' | 'month';

export interface CskhHistoryNote {
  id: string;
  at: string;
  text: string;
}

export interface CskhBottleneck {
  id: string;
  code: string;
  name: string;
  severity: CskhSeverity;
  status: CskhBottleneckStatus;
  startedAt: string;
  expectedAt: string;
  reason: string;
  departmentId?: string;
  source?: 'manual' | 'gantt' | 'meeting';
  history: CskhHistoryNote[];
  ganttTask?: string;
  pic?: string;
  resolution?: string;
}

export interface CskhMeetingAttachment {
  name: string;
  size?: string;
  url?: string;
  uploadedAt?: string;
}

export interface CskhInternalRequest {
  id: string;
  code?: string;
  name: string;
  requestType?: string;
  body?: string;
  fromDept: string;
  toDept: string;
  dueDate: string;
  priority?: CskhSeverity;
  status: CskhRequestStatus;
  createdAt: string;
  attachments?: CskhMeetingAttachment[];
}

export interface CskhGanttItem {
  id: string;
  name: string;
  days: number;
  startDate: string;
  endDate: string;
  actualPct: number;
  department?: string;
  statusLabel?: string;
  statusTone?: 'ok' | 'danger' | 'warn' | 'muted' | 'info';
  notes?: string;
  wbs?: string;
  level?: number;
  parentId?: string;
  isGroup?: boolean;
}

export interface CskhSnapshotItem {
  id: string;
  name: string;
  planPct: number;
  actualPct: number;
}

export interface CskhProgressSnapshot {
  id: string;
  at: string;
  planPct: number;
  actualPct: number;
  itemCount: number;
  items: CskhSnapshotItem[];
}

export interface CskhMeetingAction {
  id: string;
  name: string;
  dueDate: string;
  done: boolean;
  pic?: string;
  generatedBottleneck?: boolean;
}

export interface CskhMeeting {
  id: string;
  code?: string;
  projectCode?: string;
  name: string;
  date: string;
  attendees?: string;
  agenda?: string;
  minutes?: string;
  actions: CskhMeetingAction[];
  attachments?: CskhMeetingAttachment[];
}

export interface CskhProjectOps {
  bottlenecks: CskhBottleneck[];
  requests: CskhInternalRequest[];
  ganttItems: CskhGanttItem[];
  snapshots: CskhProgressSnapshot[];
  meetings: CskhMeeting[];
}

export interface CskhOpsStore {
  byProject: Record<string, CskhProjectOps>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SNAPSHOTS = 50;

export function emptyProjectOps(_projectCode?: string): CskhProjectOps {
  return {
    bottlenecks: [],
    requests: [],
    ganttItems: [],
    snapshots: [],
    meetings: [],
  };
}

export function newOpsId(): string {
  return newMasterId();
}

export function nextOpsCode(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let max = 0;
  for (const code of existing) {
    const match = re.exec(code.trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function severityLabel(id: string): string {
  return CSKH_SEVERITIES.find(item => item.id === id)?.label ?? id;
}

export function daysBetween(fromIso: string, to = Date.now()): number {
  const start = Date.parse(fromIso);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((to - start) / DAY_MS));
}

export function isPastDate(iso: string | undefined, now = Date.now()): boolean {
  if (!iso) return false;
  const due = Date.parse(iso);
  return Number.isFinite(due) && due < now;
}

export function openBottleneckCount(rows: CskhBottleneck[]): number {
  return rows.filter(row => row.status === 'open').length;
}

export function bottleneckKpis(rows: CskhBottleneck[], now = Date.now()) {
  return {
    open: openBottleneckCount(rows),
    urgent: rows.filter(row => row.status === 'open' && row.severity === 'urgent').length,
    overdue: rows.filter(row => row.status === 'open' && isPastDate(row.expectedAt, now)).length,
    closed: rows.filter(row => row.status === 'closed').length,
  };
}

export function filterBottlenecks(rows: CskhBottleneck[], filter: CskhBottleneckFilter): CskhBottleneck[] {
  return rows.filter(row => {
    if (filter === 'closed') return row.status === 'closed';
    if (filter === 'urgent' || filter === 'medium' || filter === 'low') {
      return row.status === 'open' && row.severity === filter;
    }
    return true;
  });
}

export function upsertBottleneck(ops: CskhProjectOps, item: CskhBottleneck): CskhProjectOps {
  return { ...ops, bottlenecks: upsertById(ops.bottlenecks, item) };
}

export function removeBottleneck(ops: CskhProjectOps, id: string): CskhProjectOps {
  return { ...ops, bottlenecks: removeById(ops.bottlenecks, id) };
}

export function closeBottleneck(ops: CskhProjectOps, id: string, at = new Date().toISOString()): CskhProjectOps {
  return {
    ...ops,
    bottlenecks: ops.bottlenecks.map(row => (
      row.id === id
        ? {
            ...row,
            status: 'closed' as const,
            history: [...row.history, { id: newOpsId(), at, text: 'Đã xử lý xong.' }],
          }
        : row
    )),
  };
}

export function appendBottleneckNote(ops: CskhProjectOps, id: string, text: string, at = new Date().toISOString()): CskhProjectOps {
  return {
    ...ops,
    bottlenecks: ops.bottlenecks.map(row => (
      row.id === id
        ? { ...row, history: [...row.history, { id: newOpsId(), at, text }] }
        : row
    )),
  };
}

export function requestRuntimeStatus(row: CskhInternalRequest, now = Date.now()): CskhRequestFilter {
  if (row.status === 'closed') return 'closed';
  if (isPastDate(row.dueDate, now)) return 'overdue';
  return row.status;
}

export function requestKpis(rows: CskhInternalRequest[], now = Date.now()) {
  const open = rows.filter(row => requestRuntimeStatus(row, now) !== 'closed').length;
  const needAction = rows.filter(row => {
    const status = requestRuntimeStatus(row, now);
    return status === 'open' || status === 'overdue';
  }).length;
  return { total: rows.length, open, needAction };
}

export function filterRequests(rows: CskhInternalRequest[], filter: CskhRequestFilter, now = Date.now()): CskhInternalRequest[] {
  return rows.filter(row => {
    const status = requestRuntimeStatus(row, now);
    if (filter === 'all') return true;
    return status === filter;
  });
}

export function upsertRequest(ops: CskhProjectOps, item: CskhInternalRequest): CskhProjectOps {
  return { ...ops, requests: upsertById(ops.requests, item) };
}

export function removeRequest(ops: CskhProjectOps, id: string): CskhProjectOps {
  return { ...ops, requests: removeById(ops.requests, id) };
}

export function requestsToCsv(rows: CskhInternalRequest[]): string {
  const header = ['Ten', 'Tu phong', 'Den phong', 'Han', 'Trang thai'];
  const lines = rows.map(row => (
    [row.name, row.fromDept, row.toDept, row.dueDate, requestRuntimeStatus(row)]
      .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  ));
  return `\uFEFF${[header.join(','), ...lines].join('\n')}`;
}

export function ganttItemPlanPct(item: Pick<CskhGanttItem, 'startDate' | 'endDate'>, now = Date.now()): number {
  const start = Date.parse(item.startDate);
  const end = Date.parse(item.endDate);
  if (!Number.isFinite(start)) return 0;
  if (!Number.isFinite(end) || end <= start) return now >= start ? 100 : 0;
  return clampPct(((now - start) / (end - start)) * 100);
}

export function ganttItemStatus(item: CskhGanttItem, now = Date.now()): CskhProgressStatus | 'done' {
  if (item.actualPct >= 100) return 'done';
  return progressStatus({
    planPct: ganttItemPlanPct(item, now),
    actualPct: item.actualPct,
    bottleneckCount: 0,
  });
}

export function ganttKpis(items: CskhGanttItem[] = [], now = Date.now()) {
  const safeItems = Array.isArray(items) ? items : [];
  const hasGroups = safeItems.some(row => row.isGroup);
  const targetItems = hasGroups ? safeItems.filter(row => !row.isGroup) : safeItems;
  const completed = targetItems.filter(row => row.actualPct >= 100).length;
  const delayed = targetItems.filter(row => {
    const status = ganttItemStatus(row, now);
    return status === 'slight_delay' || status === 'blocked';
  }).length;
  const weight = targetItems.map(row => Math.max(1, row.days));
  const totalW = weight.reduce((sum, value) => sum + value, 0);
  const planPct = totalW
    ? clampPct(targetItems.reduce((sum, row, i) => sum + ganttItemPlanPct(row, now) * (weight[i] ?? 1), 0) / totalW)
    : 0;
  const actualPct = totalW
    ? clampPct(targetItems.reduce((sum, row, i) => sum + row.actualPct * (weight[i] ?? 1), 0) / totalW)
    : 0;
  const lastEnd = safeItems.reduce((max, row) => {
    const end = Date.parse(row.endDate);
    return Number.isFinite(end) && end > max ? end : max;
  }, 0);
  return {
    total: targetItems.length,
    completed,
    delayed,
    planPct,
    actualPct,
    delta: progressDelta(planPct, actualPct),
    expectedEnd: lastEnd ? new Date(lastEnd).toISOString().slice(0, 10) : '',
  };
}

export function upsertGanttItem(ops: CskhProjectOps, item: CskhGanttItem): CskhProjectOps {
  return { ...ops, ganttItems: upsertById(ops.ganttItems, item) };
}

export function ganttSubtreeIds(items: CskhGanttItem[], id: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const item of items) {
    if (item.parentId) children.set(item.parentId, [...(children.get(item.parentId) ?? []), item.id]);
  }
  const ids = new Set<string>();
  const pending = items.some(item => item.id === id) ? [id] : [];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (ids.has(current)) continue;
    ids.add(current);
    pending.push(...(children.get(current) ?? []));
  }
  return ids;
}

export function removeGanttItem(ops: CskhProjectOps, id: string): CskhProjectOps {
  const deleted = ganttSubtreeIds(ops.ganttItems, id);
  return { ...ops, ganttItems: ops.ganttItems.filter(item => !deleted.has(item.id)) };
}

export function captureSnapshot(ops: CskhProjectOps, at = new Date().toISOString(), now = Date.now()): CskhProjectOps {
  const kpis = ganttKpis(ops.ganttItems, now);
  const snapshot: CskhProgressSnapshot = {
    id: newOpsId(),
    at,
    planPct: kpis.planPct,
    actualPct: kpis.actualPct,
    itemCount: ops.ganttItems.length,
    items: ops.ganttItems.map(row => ({
      id: row.id,
      name: row.name,
      planPct: ganttItemPlanPct(row, now),
      actualPct: row.actualPct,
    })),
  };
  return {
    ...ops,
    snapshots: [snapshot, ...ops.snapshots].slice(0, MAX_SNAPSHOTS),
  };
}

export function snapshotCompare(snapshots: CskhProgressSnapshot[]) {
  const current = snapshots[0];
  const previous = snapshots[1];
  return {
    current,
    previous,
    delta: current && previous ? current.actualPct - previous.actualPct : 0,
    count: snapshots.length,
  };
}

export function isoWeekNumber(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

export function reportWindow(period: CskhReportPeriod, now = new Date()): { start: Date; end: Date; label: string } {
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end, label: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}` };
  }
  const day = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end, label: `Tuần ${isoWeekNumber(now)}` };
}

export function meetingKpis(rows: CskhMeeting[], now = Date.now()) {
  let openActions = 0;
  let overdueActions = 0;
  for (const meeting of rows) {
    for (const action of meeting.actions) {
      if (action.done) continue;
      openActions += 1;
      if (isPastDate(action.dueDate, now)) overdueActions += 1;
    }
  }
  return { total: rows.length, openActions, overdueActions };
}

export function upsertMeeting(ops: CskhProjectOps, item: CskhMeeting): CskhProjectOps {
  return { ...ops, meetings: upsertById(ops.meetings, item) };
}

export function removeMeeting(ops: CskhProjectOps, id: string): CskhProjectOps {
  return { ...ops, meetings: removeById(ops.meetings, id) };
}
