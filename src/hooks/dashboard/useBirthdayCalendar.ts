import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MONTH_NAMES } from './calendarConstants';
import { hrBirthdaysService } from '../../services/hrBirthdaysService';

export interface BirthdayEvent {
  name: string;
  department: string;
}

export interface CalendarCell {
  day: number;
  isCurrentMonth: boolean;
}

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
  return { employees, customers: 0 };
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, isCurrentMonth: true });
  }
  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextMonthDay, isCurrentMonth: false });
    nextMonthDay += 1;
  }
  return cells;
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
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelectedDay(1);
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
    birthdaysByDay,
    calendarCells,
    birthdayStats,
    monthLabel: MONTH_NAMES[viewMonth],
    isLoading: birthdaysQuery.isLoading,
    isError: birthdaysQuery.isError,
  };
}
