import type React from 'react';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  addMonths,
  isSameDay,
  isoToDisplay,
  mondayFirstIndex,
  parseIsoDate,
  toIsoDate,
} from '../../lib/dates';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export type DateRangeValue = { from: string; to: string };

interface PurDateRangePickerProps {
  value: DateRangeValue | null;
  onChange: (value: DateRangeValue | null) => void;
  placeholder?: string;
  className?: string;
}

function buildMonthGrid(viewMonth: Date): (Date | null)[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = mondayFirstIndex(new Date(year, month, 1));
  const cells: (Date | null)[] = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function compareDay(a: Date, b: Date): number {
  const aa = a.getFullYear() * 10000 + a.getMonth() * 100 + a.getDate();
  const bb = b.getFullYear() * 10000 + b.getMonth() * 100 + b.getDate();
  return aa - bb;
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return compareDay(date, start) >= 0 && compareDay(date, end) <= 0;
}

type PopoverLayout = { top: number; left: number; width: number };

function computePopoverLayout(trigger: HTMLElement, popover: HTMLElement): PopoverLayout {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(560, window.innerWidth - 16);
  let left = rect.left;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - 8 - width;
  left = Math.max(8, left);

  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const popH = popover.offsetHeight || 360;
  const top =
    spaceBelow >= Math.min(popH, 280) || spaceBelow >= rect.top
      ? rect.bottom + 6
      : Math.max(8, rect.top - 6 - Math.min(popH, spaceBelow + rect.top - 8));

  return { top, left, width };
}

function MonthPanel({
  viewMonth,
  onPrev,
  onNext,
  showPrev,
  showNext,
  draftStart,
  draftEnd,
  onPick,
}: {
  viewMonth: Date;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  draftStart: Date | null;
  draftEnd: Date | null;
  onPick: (d: Date) => void;
}) {
  const cells = buildMonthGrid(viewMonth);
  const title = `${MONTHS_VI[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  return (
    <div className="pur-daterange__month">
      <div className="pur-daterange__month-head">
        {showPrev ? (
          <button type="button" className="pur-daterange__nav" onClick={onPrev} aria-label="Tháng trước">
            <ChevronLeft size={16} />
          </button>
        ) : (
          <span className="pur-daterange__nav-spacer" />
        )}
        <span className="pur-daterange__month-title">{title}</span>
        {showNext ? (
          <button type="button" className="pur-daterange__nav" onClick={onNext} aria-label="Tháng sau">
            <ChevronRight size={16} />
          </button>
        ) : (
          <span className="pur-daterange__nav-spacer" />
        )}
      </div>
      <div className="pur-daterange__weekdays">
        {WEEKDAYS.map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="pur-daterange__grid">
        {cells.map((date, i) => {
          if (!date) return <span key={`e-${i}`} className="pur-daterange__day pur-daterange__day--empty" />;
          const iso = toIsoDate(date);
          const isStart = draftStart ? isSameDay(date, draftStart) : false;
          const isEnd = draftEnd ? isSameDay(date, draftEnd) : false;
          const inRange = isInRange(date, draftStart, draftEnd);
          return (
            <button
              key={iso}
              type="button"
              className={[
                'pur-daterange__day',
                inRange && 'pur-daterange__day--in-range',
                (isStart || isEnd) && 'pur-daterange__day--selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onPick(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Dual-month date range picker — legacy ERP style (Theo thời gian). */
export default function PurDateRangePicker({
  value,
  onChange,
  placeholder = 'Chọn khoảng thời gian',
  className = '',
}: PurDateRangePickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<PopoverLayout | null>(null);
  const [leftMonth, setLeftMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(null);
  const [pickingEnd, setPickingEnd] = useState(false);

  const display = useMemo(() => {
    if (!value?.from || !value?.to) return '';
    return `${isoToDisplay(value.from)} - ${isoToDisplay(value.to)}`;
  }, [value]);

  const draftLabel = useMemo(() => {
    if (!draftStart) return '—';
    const a = isoToDisplay(toIsoDate(draftStart));
    const b = draftEnd ? isoToDisplay(toIsoDate(draftEnd)) : a;
    return `${a} - ${b}`;
  }, [draftStart, draftEnd]);

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);

  const openPicker = useCallback(() => {
    const from = parseIsoDate(value?.from);
    const to = parseIsoDate(value?.to);
    setDraftStart(from);
    setDraftEnd(to);
    setPickingEnd(Boolean(from && to));
    const base = from ?? new Date();
    setLeftMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setOpen(true);
  }, [value]);

  const closePicker = useCallback(() => {
    setOpen(false);
    setLayout(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      closePicker();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, closePicker]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current || !popoverRef.current) return;
    const update = () => {
      if (!rootRef.current || !popoverRef.current) return;
      setLayout(computePopoverLayout(rootRef.current, popoverRef.current));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, leftMonth, draftStart, draftEnd]);

  const pickDay = (date: Date) => {
    if (!pickingEnd || !draftStart) {
      setDraftStart(date);
      setDraftEnd(date);
      setPickingEnd(true);
      return;
    }
    if (compareDay(date, draftStart) < 0) {
      setDraftStart(date);
      setDraftEnd(draftStart);
    } else {
      setDraftEnd(date);
    }
    setPickingEnd(false);
  };

  const confirm = () => {
    if (!draftStart) return;
    const end = draftEnd ?? draftStart;
    const from = compareDay(draftStart, end) <= 0 ? draftStart : end;
    const to = compareDay(draftStart, end) <= 0 ? end : draftStart;
    onChange({ from: toIsoDate(from), to: toIsoDate(to) });
    closePicker();
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    closePicker();
  };

  return (
    <div ref={rootRef} className={`pur-daterange ${className}`.trim()}>
      <div className="pur-daterange__trigger-wrap">
        <button
          type="button"
          className={`pur-daterange__trigger${open ? ' is-open' : ''}`}
          onClick={() => (open ? closePicker() : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={listId}
        >
          <span className={display ? 'pur-daterange__value' : 'pur-daterange__placeholder'}>
            {display || placeholder}
          </span>
          <Calendar size={16} className="pur-daterange__icon" aria-hidden />
        </button>
        {value && (
          <button
            type="button"
            className="pur-daterange__clear"
            onClick={clear}
            aria-label="Xóa khoảng thời gian"
            title="Xóa lọc"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={listId}
            className="pur-daterange__popover"
            role="dialog"
            aria-label="Chọn khoảng thời gian"
            style={
              layout
                ? { top: layout.top, left: layout.left, width: layout.width }
                : { visibility: 'hidden' }
            }
          >
            <div className="pur-daterange__calendars">
              <MonthPanel
                viewMonth={leftMonth}
                showPrev
                onPrev={() => setLeftMonth(m => addMonths(m, -1))}
                draftStart={draftStart}
                draftEnd={draftEnd}
                onPick={pickDay}
              />
              <MonthPanel
                viewMonth={rightMonth}
                showNext
                onNext={() => setLeftMonth(m => addMonths(m, 1))}
                draftStart={draftStart}
                draftEnd={draftEnd}
                onPick={pickDay}
              />
            </div>
            <div className="pur-daterange__footer">
              <span className="pur-daterange__range-label">{draftLabel}</span>
              <div className="pur-daterange__actions">
                <button type="button" className="pur-daterange__btn pur-daterange__btn--ghost" onClick={closePicker}>
                  Thoát
                </button>
                <button
                  type="button"
                  className="pur-daterange__btn pur-daterange__btn--primary"
                  disabled={!draftStart}
                  onClick={confirm}
                >
                  Chọn
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
