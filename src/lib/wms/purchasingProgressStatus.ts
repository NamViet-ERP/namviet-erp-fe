/** Status tones for purchasing-progress Gantt + table. Keep bar, chip, and legend in sync. */

export type PurchasingProgressTone = 'planned' | 'live' | 'ok' | 'late';

export type PurchasingProgressMeta = {
  tone: PurchasingProgressTone;
  label: string;
  badgeClass: string;
};

const DONE = new Set(['completed', 'actual_receipt']);

function ymd(value: string): string {
  return value.trim().slice(0, 10);
}

export function todayYmdLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Đủ hàng / nhập thực tế giữ nguyên. Còn lại: quá hạn giao thì thành `late` (đỏ).
 * Tính theo ngày hiện tại, không cần refetch API.
 */
export function dueAwareStatus(
  status: string,
  plannedEnd?: string | null,
  today: string = todayYmdLocal(),
): string {
  if (DONE.has(status)) return status;
  if (!plannedEnd) return status;
  const end = ymd(plannedEnd);
  if (!end) return status;
  return ymd(today) > end ? 'late' : status;
}

/** Phiếu NK: duyệt = thực tế; nháp/chờ duyệt = dự kiến, quá hạn giao PO thì trễ. */
export function receiptProgressStatus(
  receiptStatus: string,
  dueDate?: string | null,
  today: string = todayYmdLocal(),
): string {
  if (receiptStatus === 'approved') return 'actual_receipt';
  const base = receiptStatus === 'pending' ? 'planned_receipt' : 'draft_receipt';
  return dueAwareStatus(base, dueDate, today);
}

/**
 * NK thực tế = mốc ngày duyệt. NK dự kiến = cửa sổ từ ngày lập phiếu tới hạn giao PO
 * (nếu lập sau hạn thì kéo từ hạn tới ngày lập, vẫn hiện trên timeline).
 */
export function receiptGanttSpan(
  receiptStatus: string,
  receiptDate: string,
  poDue?: string | null,
): { plannedStart: string; plannedEnd: string; actualEnd: string | null } {
  const created = ymd(receiptDate);
  if (receiptStatus === 'approved') {
    return { plannedStart: created, plannedEnd: created, actualEnd: created };
  }
  const due = poDue ? ymd(poDue) : '';
  if (!due) {
    return { plannedStart: created, plannedEnd: created, actualEnd: null };
  }
  if (created <= due) {
    return { plannedStart: created, plannedEnd: due, actualEnd: null };
  }
  return { plannedStart: due, plannedEnd: created, actualEnd: null };
}

export function purchasingProgressMeta(status: string): PurchasingProgressMeta {
  if (status === 'completed') {
    return { tone: 'ok', label: 'Đủ hàng', badgeClass: 'badge-success' };
  }
  if (status === 'actual_receipt') {
    return { tone: 'ok', label: 'Nhập thực tế', badgeClass: 'badge-success' };
  }
  if (status === 'late') {
    return { tone: 'late', label: 'Trễ giao', badgeClass: 'badge-error' };
  }
  if (status === 'in_progress') {
    return { tone: 'live', label: 'Đang giao', badgeClass: 'badge-md-warning' };
  }
  if (status === 'planned_receipt') {
    return { tone: 'live', label: 'Nhập dự kiến', badgeClass: 'badge-md-warning' };
  }
  if (status === 'draft_receipt') {
    return { tone: 'planned', label: 'Nháp nhập', badgeClass: 'badge-md-neutral' };
  }
  return { tone: 'planned', label: 'Chưa giao', badgeClass: 'badge-md-neutral' };
}

/** Chấm Gantt = ngày nhập thực tế trên đúng dòng đó. Dự án chưa đủ hàng thì không hiện chấm gom. */
export function showGanttActualMark(
  kind: 'project' | 'plan' | 'po' | 'line' | 'nk',
  status: string,
  actualEnd?: string | null,
  percentComplete: number = 0,
): boolean {
  if (!actualEnd) return false;
  if (kind === 'nk') return status === 'actual_receipt';
  if (kind === 'project' || kind === 'plan') return status === 'completed' || percentComplete >= 100;
  return true;
}
