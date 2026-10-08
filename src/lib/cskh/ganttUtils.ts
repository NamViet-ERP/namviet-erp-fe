import { parseIsoDate, isoToDisplay, toIsoDate } from '../../lib/dates';
import type { CskhGanttItem } from '../../lib/cskh/opsWorkspace';

export type GanttViewMode = 'kickoff' | 'contract';
export type GanttDisplayMode = 'both' | 'chart' | 'table';
export type TimeScaleMode = 'decade' | 'week' | 'day170';

export const EMPTY_FORM = {
  name: '',
  department: '',
  days: '1',
  startDate: '',
  endDate: '',
  actualPct: '0',
  notes: '',
  parentId: '',
  isGroup: false,
};

export function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export const CONTRACT_MILESTONES = [
  { id: 'cm-1', name: 'Mốc 1: Tạm ứng 20% & Bàn giao mặt bằng móng lò', date: '2026-06-01', paymentPct: '20%', status: 'done', statusLabel: 'Đã thanh toán', notes: 'CĐT đã thanh toán 20% đợt 1' },
  { id: 'cm-2', name: 'Mốc 2: Nghiệm thu balong xưởng & kết cấu thép móng (30%)', date: '2026-07-30', paymentPct: '30%', status: 'on_track', statusLabel: 'Đã hoàn tất nghiệm thu', notes: 'Biên bản nghiệm thu ARC-01' },
  { id: 'cm-3', name: 'Mốc 3: Lắp balong lên khung & hàn ống sinh hơi (20%)', date: '2026-08-25', paymentPct: '20%', status: 'delayed', statusLabel: 'Chậm do cẩu 80T & thợ 6G', notes: 'Đang giải tỏa BN-104 & BN-105' },
  { id: 'cm-4', name: 'Mốc 4: Thử áp lực thủy lực hydrostatic 1.5x (15%)', date: '2026-09-30', paymentPct: '15%', status: 'delayed', statusLabel: 'Chờ duyệt HS-301', notes: 'CĐT An Phát ngâm duyệt HS-301' },
  { id: 'cm-5', name: 'Mốc 5: Bàn giao phát điện thương mại COD (10%)', date: '2026-10-15', paymentPct: '10%', status: 'target', statusLabel: 'Mục tiêu COD', notes: 'Mốc về đích hợp đồng' },
  { id: 'cm-6', name: 'Mốc 6: Hoàn tất thời gian bảo hành 48 tháng (5%)', date: '2030-10-15', paymentPct: '5%', status: 'warranty', statusLabel: 'Bảo hành 48 tháng', notes: 'Giải tỏa bảo lãnh thực hiện HĐ' },
];

export const CHAIN_YARN_MILESTONES = [
  { id: 'cym-1', name: 'Mốc 1: Tạm ứng 20% & Đặt hàng Posco thép tấm A515/A106 Gr.B', date: '2026-08-25', paymentPct: '20%', status: 'done', statusLabel: 'Đã hoàn thành', notes: 'CĐT Chain Yarn thanh toán tạm ứng đợt 1' },
  { id: 'cym-2', name: 'Mốc 2: Nhận bàn giao mặt bằng móng lò tại KCN Bàu Bàng', date: '2026-10-03', paymentPct: '15%', status: 'on_track', statusLabel: 'Đang bàn giao', notes: 'Biên bản bàn giao tim cốt móng lò' },
  { id: 'cym-3', name: 'Mốc 3: Hoàn thành chế tạo xưởng Mayzer & Vận chuyển Đợt 1 (20%)', date: '2026-11-06', paymentPct: '20%', status: 'target', statusLabel: 'Đang chế tạo xưởng', notes: 'Nghiệm thu balong & thân lò tại xưởng Mayzer' },
  { id: 'cym-4', name: 'Mốc 4: Lắp thân lò, balong và hàn dàn ống bức xạ buồng đốt (15%)', date: '2026-12-26', paymentPct: '15%', status: 'target', statusLabel: 'Mục tiêu lắp đặt', notes: 'Cẩu 100T & tổ thợ hàn 6G công trường' },
  { id: 'cym-5', name: 'Mốc 5: Thử áp lực thủy lực toàn bộ lò hơi 1.5x (Hydrostatic test) (10%)', date: '2027-01-16', paymentPct: '10%', status: 'target', statusLabel: 'Mục tiêu thử áp', notes: 'Sở LĐ-TBXH & Kiểm định an toàn cấp phép' },
  { id: 'cym-6', name: 'Mốc 6: Sấy lò, đốt thử nghiệm và hiệu chỉnh chế độ cháy (10%)', date: '2027-02-19', paymentPct: '10%', status: 'target', statusLabel: 'Mục tiêu sấy lò', notes: 'Đốt sấy gạch chịu lửa & dăm gỗ biomass' },
  { id: 'cym-7', name: 'Mốc 7: Cấp hơi thương mại COD & Bàn giao đưa vào vận hành (10%)', date: '2027-03-20', paymentPct: '10%', status: 'target', statusLabel: 'Mục tiêu COD', notes: 'Hoàn tất nghiệm thu thương mại COD' },
];

export const DEFAULT_MILESTONE_PINS = [
  { id: 'm-1', label: 'M1: Tạm ứng 20%', date: '2026-06-01', color: '#0284c7', tier: 'top' as const },
  { id: 'm-2', label: 'M2: Balong xưởng (30%)', date: '2026-07-30', color: '#16a34a', tier: 'top' as const },
  { id: 'm-3', label: 'M3: Lắp thân lò (20%)', date: '2026-08-25', color: '#dc2626', tier: 'top' as const },
  { id: 'm-4', label: 'M4: Thử áp 15%', date: '2026-09-30', color: '#d97706', tier: 'top' as const },
  { id: 'm-5', label: 'M5: COD Thương mại (10%)', date: '2026-10-15', color: '#0284c7', tier: 'bottom' as const },
];

export const CHAIN_YARN_MILESTONE_PINS = [
  { id: 'cy-1', label: 'M1: Khởi động (25/08)', date: '2026-08-25', color: '#0284c7', tier: 'top' as const },
  { id: 'cy-2', label: 'M2: Nhận MB (03/10)', date: '2026-10-03', color: '#16a34a', tier: 'bottom' as const },
  { id: 'cy-3', label: 'M3: Mayzer Đ1 (06/11)', date: '2026-11-06', color: '#7c3aed', tier: 'top' as const },
  { id: 'cy-4', label: 'M4: Thân lò (26/12)', date: '2026-12-26', color: '#0284c7', tier: 'bottom' as const },
  { id: 'cy-5', label: 'M5: Thử áp (16/01)', date: '2027-01-16', color: '#d97706', tier: 'top' as const },
  { id: 'cy-6', label: 'M6: Sấy lò (19/02)', date: '2027-02-19', color: '#ea580c', tier: 'bottom' as const },
  { id: 'cy-7', label: 'M7: COD (20/03)', date: '2027-03-20', color: '#16a34a', tier: 'top' as const },
];

export interface TimelineSubdivision {
  key: string;
  label: string;
  sublabel: string;
  daysCount: number;
  startOffsetDays: number;
  widthPct: number;
  isCurrent?: boolean;
}

export interface TimelineMonth {
  key: string;
  year: number;
  month: number;
  label: string;
  daysCount: number;
  startOffsetDays: number;
  widthPct: number;
  subdivisions: TimelineSubdivision[];
}

export function getIsoWeekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNr);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function buildTimelineStructure(items: CskhGanttItem[], scaleMode: TimeScaleMode = 'decade', todayStr = '2026-09-22') {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const item of items) {
    const s = parseIsoDate(item.startDate);
    const e = parseIsoDate(item.endDate);
    if (s) {
      const monthStart = new Date(s.getFullYear(), s.getMonth(), 1);
      if (!minDate || monthStart < minDate) minDate = monthStart;
    }
    if (e) {
      const monthEnd = new Date(e.getFullYear(), e.getMonth() + 1, 0);
      if (!maxDate || monthEnd > maxDate) maxDate = monthEnd;
    }
  }

  // Fallback defaults
  if (!minDate) minDate = new Date(2026, 7, 1); // 2026-08-01 default
  if (!maxDate) maxDate = new Date(2027, 2, 31); // 2027-03-31 default

  minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

  const today = parseIsoDate(todayStr) ?? new Date();
  const startTime = minDate.getTime();
  const endTime = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((endTime - startTime) / msPerDay));
  const todayOffsetDays = Math.max(0, Math.round((today.getTime() - startTime) / msPerDay));
  const todayLeftPct = Math.min(100, Math.max(0, (todayOffsetDays / totalDays) * 100));

  const months: TimelineMonth[] = [];
  let cur = new Date(minDate);

  while (cur <= maxDate) {
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStart = new Date(year, month, 1).getTime();
    const startOffsetDays = Math.max(0, Math.round((monthStart - startTime) / msPerDay));
    const widthPct = (daysInMonth / totalDays) * 100;

    let subDefs: { label: string; sublabel: string; days: number }[];

    if (scaleMode === 'decade') {
      // 3 clean, highly legible 10-day intervals (Thập niên)
      subDefs = [
        { label: '01 - 10', sublabel: 'Đầu tháng', days: 10 },
        { label: '11 - 20', sublabel: 'Giữa tháng', days: 10 },
        { label: `21 - ${daysInMonth}`, sublabel: 'Cuối tháng', days: daysInMonth - 20 },
      ];
    } else if (scaleMode === 'week') {
      // Accurate ISO Weeks per month
      const w1 = new Date(year, month, 4);
      const w2 = new Date(year, month, 11);
      const w3 = new Date(year, month, 18);
      const w4 = new Date(year, month, 25);
      subDefs = [
        { label: `W${getIsoWeekNumber(w1)}`, sublabel: '01-07', days: 7 },
        { label: `W${getIsoWeekNumber(w2)}`, sublabel: '08-14', days: 7 },
        { label: `W${getIsoWeekNumber(w3)}`, sublabel: '15-21', days: 7 },
        { label: `W${getIsoWeekNumber(w4)}`, sublabel: `22-${daysInMonth}`, days: daysInMonth - 21 },
      ];
    } else {
      // 170-Day Kick-off project timeline days
      const dStart = startOffsetDays;
      subDefs = [
        { label: `N${dStart + 1} - N${dStart + 15}`, sublabel: '15 ngày', days: 15 },
        { label: `N${dStart + 16} - N${dStart + daysInMonth}`, sublabel: `${daysInMonth - 15} ngày`, days: daysInMonth - 15 },
      ];
    }

    let wOffset = startOffsetDays;
    const subdivisions = subDefs.map((def, idx) => {
      const wDays = def.days;
      const wStart = wOffset;
      wOffset += wDays;
      const isCurrent = todayOffsetDays >= wStart && todayOffsetDays < (wStart + wDays);
      return {
        key: `sub-${year}-${month}-${idx}`,
        label: def.label,
        sublabel: def.sublabel,
        daysCount: wDays,
        startOffsetDays: wStart,
        widthPct: (wDays / totalDays) * 100,
        isCurrent,
      };
    });

    months.push({
      key: `m-${year}-${month}`,
      year,
      month,
      label: `Tháng ${month + 1}/${year}`,
      daysCount: daysInMonth,
      startOffsetDays,
      widthPct,
      subdivisions,
    });

    cur = new Date(year, month + 1, 1);
  }

  return {
    startTime,
    endTime,
    totalDays,
    months,
    todayLeftPct,
    todayStr: isoToDisplay(todayStr) || '22/09/2026',
  };
}

export function calculateItemBar(item: CskhGanttItem, startTime: number, totalDays: number) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const s = parseIsoDate(item.startDate)?.getTime() ?? startTime;
  const e = parseIsoDate(item.endDate)?.getTime() ?? (s + Math.max(1, item.days) * msPerDay);
  const startOffset = Math.max(0, Math.round((s - startTime) / msPerDay));
  const duration = Math.max(0, Math.round((e - s) / msPerDay));
  const leftPct = (startOffset / totalDays) * 100;
  const widthPct = item.days === 0 ? 0.5 : Math.max(1.5, (duration / totalDays) * 100);

  return { leftPct, widthPct, duration };
}

