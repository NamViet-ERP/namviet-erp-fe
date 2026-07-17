import { useMemo, useState } from 'react';
import { useRecruitmentCalendar } from './useRecruitmentCalendar';
import { MONTH_NAMES, MONTH_NAMES_TITLE, WEEKDAY_LABELS } from './dashboard/calendarConstants';
import {
  buildInterviewCalendarCells,
  groupInterviewsByDay,
  monthDateRange,
  type ParsedInterviewEvent,
} from '../lib/hrm/interviewCalendarUtils';

export function useRecruitmentInterviewCalendar() {
  const now = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const today = now.getDate();
  const isViewingCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const [selectedDay, setSelectedDay] = useState<number>(today);

  const { from, to } = monthDateRange(viewYear, viewMonth);
  const calendarQuery = useRecruitmentCalendar(from, to);

  const interviewsByDay = useMemo(
    () => groupInterviewsByDay(calendarQuery.data ?? [], viewYear, viewMonth),
    [calendarQuery.data, viewYear, viewMonth],
  );

  const calendarCells = useMemo(
    () => buildInterviewCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthInterviews = useMemo(() => {
    const rows: ParsedInterviewEvent[] = [];
    Object.values(interviewsByDay).forEach(items => rows.push(...items));
    return rows.sort((a, b) => a.sortAt - b.sortAt);
  }, [interviewsByDay]);

  const shiftMonth = (delta: number) => {
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelectedDay(1);
  };

  const goToday = () => {
    const t = new Date();
    setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDay(t.getDate());
  };

  const setViewMonthYear = (year: number, month: number) => {
    setViewDate(new Date(year, month, 1));
    setSelectedDay(1);
  };

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 2 + i);
  }, [now]);

  return {
    now,
    viewYear,
    viewMonth,
    today,
    isViewingCurrentMonth,
    selectedDay,
    setSelectedDay,
    shiftMonth,
    goToday,
    setViewMonthYear,
    yearOptions,
    interviewsByDay,
    calendarCells,
    monthInterviews,
    monthLabel: MONTH_NAMES[viewMonth],
    monthTitle: MONTH_NAMES_TITLE[viewMonth],
    weekdayLabels: WEEKDAY_LABELS,
    isLoading: calendarQuery.isLoading,
    isError: calendarQuery.isError,
    error: calendarQuery.error,
  };
}
