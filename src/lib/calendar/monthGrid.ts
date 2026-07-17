import { mondayFirstIndex } from '../dates';

export interface MonthCalendarCell {
  day: number;
  isCurrentMonth: boolean;
}

/** Lưới tháng bắt đầu từ Thứ Hai (T2 → CN). */
export function buildMonthCalendarCells(year: number, month: number): MonthCalendarCell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const pad = mondayFirstIndex(new Date(year, month, 1));
  const cells: MonthCalendarCell[] = [];

  for (let i = pad - 1; i >= 0; i -= 1) {
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
  while (cells.length < 42) {
    cells.push({ day: nextMonthDay, isCurrentMonth: false });
    nextMonthDay += 1;
  }
  return cells;
}
