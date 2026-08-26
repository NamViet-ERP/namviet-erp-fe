import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MONTH_NAMES } from './calendarConstants';
import { buildMonthCalendarCells, type MonthCalendarCell } from '../../lib/calendar/monthGrid';
import { hrBirthdaysService } from '../../services/hrBirthdaysService';

export interface BirthdayEvent {
  name: string;
  department: string;
}

export type CalendarCell = MonthCalendarCell;

function buildBirthdaysByDay(rows: { name: string; department: string; day: number }[]): Record<number, BirthdayEvent[]> {
  const map: Record<number, BirthdayEvent[]> = {};

  for (const row of rows) {
    if (!map[row.day]) map[row.day] = [];
    map[row.day].push({ name: row.name, department: row.department });
  }

  for (const day of Object.keys(map)) {
    map[Number(day)].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  return map;
}

function countMonthBirthdays(data: Record<number, BirthdayEvent[]>) {
  let employees = 0;
  Object.values(data).forEach((events) => {
    employees += events.length;
  });
  return { employees };
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  return buildMonthCalendarCells(year, month);
}

export function useBirthdayCalendar() {
  const now = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const today = now.getDate();
  const isViewingCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const [selectedDay, setSelectedDay] = useState<number>(today);

  const birthdaysQuery = useQuery({
    queryKey: ['hr', 'birthdays', viewYear, viewMonth],
    queryFn: () => hrBirthdaysService.list(viewMonth + 1),
    placeholderData: (previous) => previous,
    staleTime: 5 * 60 * 1000,
  });

  const birthdaysByDay = useMemo(
    () => buildBirthdaysByDay(birthdaysQuery.data ?? []),
    [birthdaysQuery.data],
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const birthdayStats = useMemo(() => countMonthBirthdays(birthdaysByDay), [birthdaysByDay]);

  const shiftMonth = (delta: number) => {
    setViewDate((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + delta, 1);
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      setSelectedDay((day) => Math.min(day, daysInMonth));
      return next;
    });
  };

  const goToday = () => {
    const current = new Date();
    setViewDate(new Date(current.getFullYear(), current.getMonth(), 1));
    setSelectedDay(current.getDate());
  };

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
    birthdaysByDay,
    calendarCells,
    birthdayStats,
    monthLabel: MONTH_NAMES[viewMonth],
    isInitialLoading: birthdaysQuery.isLoading && birthdaysQuery.data === undefined,
    isFetching: birthdaysQuery.isFetching,
    isError: birthdaysQuery.isError,
  };
}
