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

export function buildTimelineStructure(
  items: CskhGanttItem[],
  scaleMode: TimeScaleMode = 'decade',
  todayStr: string = toIsoDate(new Date()),
) {
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

  const today = parseIsoDate(todayStr) ?? new Date();
  if (!minDate) minDate = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!maxDate) maxDate = new Date(today.getFullYear(), today.getMonth() + 4, 0);

  minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

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
    todayStr: isoToDisplay(todayStr) || isoToDisplay(toIsoDate(today)),
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

