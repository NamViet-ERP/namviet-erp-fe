import { useMemo, useState } from 'react';
import type { Employee } from '../../types/hr';
import { MONTH_NAMES } from './calendarConstants';

export interface BirthdayEvent {
  name: string;
  role: 'Nhân viên' | 'Khách hàng';
}

export interface CalendarCell {
  day: number;
  isCurrentMonth: boolean;
}

function parseBirthMonthDay(birthDate: string): { month: number; day: number } | null {
  const raw = birthDate?.trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { month: Number(iso[2]) - 1, day: Number(iso[3]) };

  const vn = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vn) return { month: Number(vn[2]) - 1, day: Number(vn[1]) };

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return { month: parsed.getMonth(), day: parsed.getDate() };
}

function buildBirthdaysByDay(employees: Employee[], month: number): Record<number, BirthdayEvent[]> {
  const map: Record<number, BirthdayEvent[]> = {};

  for (const emp of employees) {
    const md = parseBirthMonthDay(emp.birthDate);
    if (!md || md.month !== month) continue;
    if (!map[md.day]) map[md.day] = [];
    map[md.day].push({ name: emp.fullName, role: 'Nhân viên' });
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

export function useBirthdayCalendar(employees: Employee[]) {
  const now = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const today = now.getDate();
  const isViewingCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const [selectedDay, setSelectedDay] = useState<number>(today);

  const birthdaysByDay = useMemo(
    () => buildBirthdaysByDay(employees, viewMonth),
    [employees, viewMonth],
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
  };
}
