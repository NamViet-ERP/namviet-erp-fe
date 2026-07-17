import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Cake, Gift } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { MONTH_NAMES_TITLE, WEEKDAY_LABELS } from '../../hooks/dashboard/calendarConstants';
import type { BirthdayEvent, CalendarCell } from '../../hooks/dashboard/useBirthdayCalendar';
import { mondayFirstIndex } from '../../lib/dates';
import { formatDate } from '../../utils/formatDate';

export interface PortalBirthdayCalendarProps {
  viewYear: number;
  viewMonth: number;
  today: number;
  isViewingCurrentMonth: boolean;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  shiftMonth: (delta: number) => void;
  goToday: () => void;
  birthdaysByDay: Record<number, BirthdayEvent[]>;
  calendarCells: CalendarCell[];
  monthBirthdayCount: number;
  isInitialLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatAgendaHeading(day: number, month: number, year: number): string {
  const date = new Date(year, month, day);
  const weekday = WEEKDAY_LABELS[mondayFirstIndex(date)];
  return `${weekday}, ${formatDate(date)}`;
}

export default function PortalBirthdayCalendar({
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
  monthBirthdayCount,
  isInitialLoading,
  isFetching,
  isError,
}: PortalBirthdayCalendarProps) {
  const monthTitle = `${MONTH_NAMES_TITLE[viewMonth]} ${viewYear}`;

  const agendaDays = useMemo(
    () =>
      Object.keys(birthdaysByDay)
        .map(Number)
        .sort((a, b) => a - b)
        .map((day) => ({ day, events: birthdaysByDay[day] })),
    [birthdaysByDay],
  );

  const selectedHasBirthdays = (birthdaysByDay[selectedDay]?.length ?? 0) > 0;

  if (isInitialLoading) {
    return (
      <section className="portal-bday-cal surface-panel surface-panel--table">
        <header className="surface-panel__header portal-bday-cal__header">
          <div className="portal-bday-cal__header-main">
            <Cake size={15} className="portal-bday-cal__header-icon" aria-hidden />
            <h3 className="surface-panel__header-title">Lịch sinh nhật nhân viên</h3>
          </div>
        </header>
        <p className="portal-bday-cal__status">Đang tải lịch sinh nhật…</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="portal-bday-cal surface-panel surface-panel--table">
        <header className="surface-panel__header portal-bday-cal__header">
          <div className="portal-bday-cal__header-main">
            <Cake size={15} className="portal-bday-cal__header-icon" aria-hidden />
            <h3 className="surface-panel__header-title">Lịch sinh nhật nhân viên</h3>
          </div>
        </header>
        <div className="portal-bday-cal__status">
          <EmptyState message="Không tải được lịch sinh nhật" icon={Gift} />
        </div>
      </section>
    );
  }

  return (
    <section className="portal-bday-cal surface-panel surface-panel--table">
      <header className="surface-panel__header portal-bday-cal__header">
        <div className="portal-bday-cal__header-main">
          <Cake size={15} className="portal-bday-cal__header-icon" aria-hidden />
          <h3 className="surface-panel__header-title">Lịch sinh nhật nhân viên</h3>
        </div>
        <span className="portal-bday-cal__header-badge">
          {monthBirthdayCount} trong tháng
        </span>
      </header>

      <div className="portal-bday-cal__nav">
        <div className="portal-bday-cal__nav-left">
          <button type="button" className="portal-bday-cal__today" onClick={goToday}>
            Hôm nay
          </button>
          <span className="portal-bday-cal__month">{monthTitle}</span>
          <span className="portal-bday-cal__fetching-slot" aria-live="polite">
            {isFetching ? 'Đang cập nhật…' : '\u00a0'}
          </span>
        </div>
        <div className="portal-bday-cal__nav-actions">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="portal-calendar-nav__btn"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="portal-calendar-nav__btn"
            aria-label="Tháng sau"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        className={[
          'portal-bday-cal__content',
          isFetching && 'portal-bday-cal__content--fetching',
        ].filter(Boolean).join(' ')}
      >
        <div className="portal-bday-cal__mini">
          <div className="portal-bday-cal__mini-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="portal-bday-cal__mini-grid">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.isCurrentMonth && cell.day === today && isViewingCurrentMonth;
              const isSelected = cell.isCurrentMonth && selectedDay === cell.day;
              const hasBirthdays = cell.isCurrentMonth && Boolean(birthdaysByDay[cell.day]?.length);

              return (
                <button
                  key={`${viewYear}-${viewMonth}-${cell.isCurrentMonth ? 'in' : 'out'}-${cell.day}-${idx}`}
                  type="button"
                  disabled={!cell.isCurrentMonth}
                  onClick={() => {
                    if (cell.isCurrentMonth) setSelectedDay(cell.day);
                  }}
                  className={[
                    'portal-bday-cal__mini-day',
                    !cell.isCurrentMonth && 'portal-bday-cal__mini-day--muted',
                    isToday && 'portal-bday-cal__mini-day--today',
                    isSelected && 'portal-bday-cal__mini-day--selected',
                    hasBirthdays && 'portal-bday-cal__mini-day--has',
                  ].filter(Boolean).join(' ')}
                  aria-label={
                    cell.isCurrentMonth
                      ? `Ngày ${cell.day}${hasBirthdays ? ', có sinh nhật' : ''}${isToday ? ', hôm nay' : ''}`
                      : undefined
                  }
                  aria-pressed={cell.isCurrentMonth ? isSelected : undefined}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        <p
          className={[
            'portal-bday-cal__selected-hint',
            selectedHasBirthdays && 'portal-bday-cal__selected-hint--spacer',
          ].filter(Boolean).join(' ')}
          aria-hidden={selectedHasBirthdays}
        >
          {!selectedHasBirthdays
            ? `Ngày ${formatDate(new Date(viewYear, viewMonth, selectedDay))}: không có sinh nhật.`
            : '\u00a0'}
        </p>

        <div className="portal-bday-cal__timeline">
          <h4 className="portal-bday-cal__timeline-title">
            <Gift size={13} aria-hidden />
            Sinh nhật trong tháng
          </h4>

          <div className="portal-bday-cal__timeline-body">
          {agendaDays.length === 0 ? (
            <p className="portal-bday-cal__empty">
              Không có sinh nhật trong tháng này.
            </p>
          ) : (
            <div className="portal-bday-cal__timeline-groups">
              {agendaDays.map(({ day, events }) => {
                const isSelected = selectedDay === day;
                return (
                  <section
                    key={day}
                    className={[
                      'portal-bday-cal__timeline-group',
                      isSelected && 'portal-bday-cal__timeline-group--selected',
                    ].filter(Boolean).join(' ')}
                  >
                    <button
                      type="button"
                      className="portal-bday-cal__timeline-date"
                      onClick={() => setSelectedDay(day)}
                    >
                      <span>{formatAgendaHeading(day, viewMonth, viewYear)}</span>
                      <span className="portal-bday-cal__timeline-count">{events.length}</span>
                    </button>
                    <ul className="portal-bday-cal__timeline-people">
                      {events.map((person) => (
                        <li key={person.name} className="portal-bday-cal__person-row">
                          <span className="portal-bday-cal__avatar" aria-hidden>
                            {getInitials(person.name)}
                          </span>
                          <span className="portal-bday-cal__person-meta">
                            <strong className="portal-bday-cal__person-name">{person.name}</strong>
                            {person.department && (
                              <span className="portal-bday-cal__person-dept">{person.department}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
