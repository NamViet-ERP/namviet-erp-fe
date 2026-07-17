import type { RecruitmentCalendarEventApiDto } from '../../services/recruitmentCalendarService';
import { buildMonthCalendarCells, type MonthCalendarCell } from '../calendar/monthGrid';
import { toIsoDate } from '../dates';

export type InterviewCalendarCell = MonthCalendarCell;

export interface ParsedInterviewEvent extends RecruitmentCalendarEventApiDto {
  day: number;
  month: number;
  year: number;
  timeLabel: string | null;
  sortAt: number;
}

const TIME_RE = /(\d{1,2}):(\d{2})/;

export function formatInterviewTimeLabel(value?: string): string | null {
  if (!value?.trim()) return null;
  const match = TIME_RE.exec(value.trim());
  if (!match) return value.trim();
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function formatInterviewDateOnly(value?: string): string {
  if (!value?.trim()) return '—';
  const trimmed = value.trim();
  const vi = /^(\d{2}\/\d{2}\/\d{4})/.exec(trimmed);
  if (vi) return vi[1];
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return trimmed.split(/[ T]/)[0] ?? trimmed;
}

export function resolveEventTimeLabel(
  event: Pick<RecruitmentCalendarEventApiDto, 'interviewDate' | 'interviewTime'> & { timeLabel?: string | null },
): string | null {
  if (event.timeLabel) return event.timeLabel;
  const fromField = formatInterviewTimeLabel(event.interviewTime);
  if (fromField) return fromField;
  const parsed = parseInterviewDateTime(event.interviewDate, event.interviewTime);
  return parsed?.timeLabel ?? null;
}

function resolveTimeParts(
  embeddedHour?: string,
  embeddedMinute?: string,
  interviewTime?: string,
): { hour: number; minute: number; label: string | null } {
  if (embeddedHour) {
    return {
      hour: Number(embeddedHour),
      minute: embeddedMinute ? Number(embeddedMinute) : 0,
      label: `${embeddedHour.padStart(2, '0')}:${(embeddedMinute ?? '00').padStart(2, '0')}`,
    };
  }

  const fallback = formatInterviewTimeLabel(interviewTime);
  if (!fallback) {
    return { hour: 9, minute: 0, label: null };
  }

  const [hourText, minuteText] = fallback.split(':');
  return {
    hour: Number(hourText),
    minute: Number(minuteText),
    label: fallback,
  };
}

export function parseInterviewDateTime(
  value: string,
  interviewTime?: string,
): Omit<ParsedInterviewEvent, keyof RecruitmentCalendarEventApiDto> | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const vi = /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?/.exec(trimmed);
  if (vi) {
    const day = Number(vi[1]);
    const month = Number(vi[2]);
    const year = Number(vi[3]);
    const { hour, minute, label } = resolveTimeParts(vi[4], vi[5], interviewTime);
    const sortAt = new Date(year, month - 1, day, hour, minute).getTime();
    return { day, month, year, timeLabel: label, sortAt };
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(trimmed);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const { hour, minute, label } = resolveTimeParts(iso[4], iso[5], interviewTime);
    const sortAt = new Date(year, month - 1, day, hour, minute).getTime();
    return { day, month, year, timeLabel: label, sortAt };
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  const timeMatch = TIME_RE.exec(trimmed);
  const label = timeMatch
    ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
    : formatInterviewTimeLabel(interviewTime)
      ?? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
    timeLabel: label,
    sortAt: d.getTime(),
  };
}

export function buildInterviewCalendarCells(year: number, month: number): InterviewCalendarCell[] {
  return buildMonthCalendarCells(year, month);
}

export function monthDateRange(year: number, month: number) {
  const from = toIsoDate(new Date(year, month, 1));
  const to = toIsoDate(new Date(year, month + 1, 0));
  return { from, to };
}

export function groupInterviewsByDay(
  events: RecruitmentCalendarEventApiDto[],
  year: number,
  month: number,
): Record<number, ParsedInterviewEvent[]> {
  const map: Record<number, ParsedInterviewEvent[]> = {};

  for (const ev of events) {
    const parsed = parseInterviewDateTime(ev.interviewDate, ev.interviewTime);
    if (!parsed) continue;
    if (parsed.year !== year || parsed.month !== month + 1) continue;
    if (!map[parsed.day]) map[parsed.day] = [];
    map[parsed.day].push({ ...ev, ...parsed });
  }

  for (const day of Object.keys(map)) {
    map[Number(day)].sort((a, b) => a.sortAt - b.sortAt);
  }

  return map;
}

export function formatInterviewCountLabel(count: number): string {
  if (count <= 0) return '';
  return count === 1 ? '1 PV' : `${count} PV`;
}
