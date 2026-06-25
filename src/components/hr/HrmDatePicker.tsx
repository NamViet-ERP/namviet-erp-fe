import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  isSameDay,
  isoToDisplay,
  mondayFirstIndex,
  parseDisplayDate,
  parseIsoDate,
  toIsoDate,
} from '../../lib/dates';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

interface HrmDatePickerProps {
  value?: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  min?: string;
  max?: string;
  yearFrom?: number;
  yearTo?: number;
  disabled?: boolean;
  error?: boolean;
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

function isWithinBounds(date: Date, min?: string, max?: string): boolean {
  const iso = toIsoDate(date);
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}

function resolveYearRange(min?: string, max?: string, yearFrom?: number, yearTo?: number) {
  const current = new Date().getFullYear();
  const minYear = min ? parseIsoDate(min)?.getFullYear() : undefined;
  const maxYear = max ? parseIsoDate(max)?.getFullYear() : undefined;
  const from = yearFrom ?? minYear ?? current - 80;
  const to = yearTo ?? maxYear ?? current + 5;
  return { from: Math.min(from, to), to: Math.max(from, to) };
}

const POPOVER_GAP = 6;
const VIEWPORT_PADDING = 8;
const POPOVER_WIDTH = 320;

type PopoverLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
};

function computePopoverLayout(triggerRect: DOMRect, popover: HTMLElement): PopoverLayout {
  const popoverHeight = popover.offsetHeight || 380;
  const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);

  const spaceBelow = window.innerHeight - triggerRect.bottom - POPOVER_GAP - VIEWPORT_PADDING;
  const spaceAbove = triggerRect.top - POPOVER_GAP - VIEWPORT_PADDING;
  const placement: 'top' | 'bottom' =
    spaceBelow >= popoverHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';
  const maxHeight = Math.max(180, placement === 'bottom' ? spaceBelow : spaceAbove);

  const top =
    placement === 'bottom'
      ? triggerRect.bottom + POPOVER_GAP
      : Math.max(VIEWPORT_PADDING, triggerRect.top - POPOVER_GAP - Math.min(popoverHeight, maxHeight));

  let left = triggerRect.left;
  if (left + width > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - VIEWPORT_PADDING - width;
  }
  left = Math.max(VIEWPORT_PADDING, left);

  return { top, left, width, maxHeight, placement };
}

export default function HrmDatePicker({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Chọn ngày',
  min,
  max,
  yearFrom,
  yearTo,
  disabled,
  error,
  className = '',
}: HrmDatePickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverLayout, setPopoverLayout] = useState<PopoverLayout | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [quickError, setQuickError] = useState('');
  const selected = parseIsoDate(value);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(() =>
    selected
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const { from: rangeFrom, to: rangeTo } = useMemo(
    () => resolveYearRange(min, max, yearFrom, yearTo),
    [min, max, yearFrom, yearTo],
  );

  const years = useMemo(
    () => Array.from({ length: rangeTo - rangeFrom + 1 }, (_, i) => rangeTo - i),
    [rangeFrom, rangeTo],
  );

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
      setPopoverLayout(null);
      onBlur?.();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onBlur]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !popoverRef.current) return;

    const updateLayout = () => {
      if (!triggerRef.current || !popoverRef.current) return;
      setPopoverLayout(
        computePopoverLayout(triggerRef.current.getBoundingClientRect(), popoverRef.current),
      );
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [open, viewMonth, value, quickError]);

  const closePopover = useCallback(() => {
    setOpen(false);
    setPopoverLayout(null);
  }, []);

  const handleToggleOpen = useCallback(() => {
    if (disabled) return;
    if (open) {
      closePopover();
      return;
    }
    const sel = parseIsoDate(value);
    setViewMonth(
      sel
        ? new Date(sel.getFullYear(), sel.getMonth(), 1)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );
    setQuickInput(value ? isoToDisplay(value) : '');
    setQuickError('');
    setOpen(true);
  }, [closePopover, disabled, open, today, value]);

  const cells = buildMonthGrid(viewMonth);
  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();

  const pick = (date: Date) => {
    if (!isWithinBounds(date, min, max)) return;
    onChange(toIsoDate(date));
    closePopover();
    onBlur?.();
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    closePopover();
    onBlur?.();
  };

  const setMonth = (monthIndex: number) => {
    setViewMonth(new Date(viewYear, monthIndex, 1));
  };

  const setYear = (year: number) => {
    setViewMonth(new Date(year, viewMonthIndex, 1));
  };

  const applyQuickInput = () => {
    const trimmed = quickInput.trim();
    if (!trimmed) {
      setQuickError('');
      return;
    }
    const parsed = parseDisplayDate(trimmed);
    if (!parsed) {
      setQuickError('Định dạng: dd/MM/yyyy (vd: 15/03/1973)');
      return;
    }
    if (!isWithinBounds(parsed, min, max)) {
      setQuickError('Ngày nằm ngoài phạm vi cho phép');
      return;
    }
    pick(parsed);
  };

  const prevMonthLast = new Date(viewYear, viewMonthIndex, 0);
  const nextMonthFirst = addMonths(viewMonth, 1);
  const canGoPrev = !min || toIsoDate(prevMonthLast) >= min;
  const canGoNext = !max || toIsoDate(nextMonthFirst) <= max;

  const popover = open ? (
        <div
          ref={popoverRef}
          id={listId}
          className="hrm-date-picker__popover hrm-date-picker__popover--floating"
          role="dialog"
          aria-label="Chọn ngày"
          style={
            popoverLayout
              ? {
                  top: popoverLayout.top,
                  left: popoverLayout.left,
                  width: popoverLayout.width,
                  maxHeight: popoverLayout.maxHeight,
                }
              : { visibility: 'hidden' as const }
          }
        >
          <div className="hrm-date-picker__quick">
            <input
              type="text"
              className={`hrm-date-picker__quick-input ${quickError ? 'hrm-date-picker__quick-input--error' : ''}`}
              value={quickInput}
              onChange={e => { setQuickInput(e.target.value); setQuickError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyQuickInput(); } }}
              placeholder="Nhập nhanh: 15/03/1973"
              aria-label="Nhập ngày theo định dạng dd/MM/yyyy"
            />
            <button type="button" className="hrm-date-picker__quick-btn" onClick={applyQuickInput}>
              Áp dụng
            </button>
          </div>
          {quickError && <p className="hrm-date-picker__quick-error">{quickError}</p>}

          <div className="hrm-date-picker__header">
            <button
              type="button"
              className="hrm-date-picker__nav"
              onClick={() => setViewMonth(m => addMonths(m, -1))}
              disabled={!canGoPrev}
              aria-label="Tháng trước"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="hrm-date-picker__selects">
              <select
                className="hrm-date-picker__select"
                value={viewMonthIndex}
                onChange={e => setMonth(Number(e.target.value))}
                aria-label="Chọn tháng"
              >
                {MONTHS_VI.map((label, i) => (
                  <option key={label} value={i}>{label}</option>
                ))}
              </select>
              <select
                className="hrm-date-picker__select hrm-date-picker__select--year"
                value={viewYear}
                onChange={e => setYear(Number(e.target.value))}
                aria-label="Chọn năm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="hrm-date-picker__nav"
              onClick={() => setViewMonth(m => addMonths(m, 1))}
              disabled={!canGoNext}
              aria-label="Tháng sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="hrm-date-picker__weekdays">
            {WEEKDAYS.map(d => (
              <span key={d} className="hrm-date-picker__weekday">{d}</span>
            ))}
          </div>

          <div className="hrm-date-picker__grid">
            {cells.map((date, i) => {
              if (!date) return <span key={`empty-${i}`} className="hrm-date-picker__day hrm-date-picker__day--empty" />;
              const outOfRange = !isWithinBounds(date, min, max);
              const isSelected = selected ? isSameDay(date, selected) : false;
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={toIsoDate(date)}
                  type="button"
                  disabled={outOfRange}
                  className={[
                    'hrm-date-picker__day',
                    isSelected && 'hrm-date-picker__day--selected',
                    isToday && !isSelected && 'hrm-date-picker__day--today',
                    outOfRange && 'hrm-date-picker__day--disabled',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="hrm-date-picker__footer">
            <button type="button" className="hrm-date-picker__action" onClick={() => pick(today)}>
              Hôm nay
            </button>
            {value && (
              <button type="button" className="hrm-date-picker__action hrm-date-picker__action--muted" onClick={clear}>
                Xóa
              </button>
            )}
          </div>
        </div>
  ) : null;

  return (
    <div ref={rootRef} className={`hrm-date-picker ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={`hrm-date-picker__trigger hrm-field-input ${error ? 'hrm-field-input--error' : ''} ${open ? 'hrm-date-picker__trigger--open' : ''}`}
        onClick={handleToggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listId}
      >
        <span className={value ? 'hrm-date-picker__value' : 'hrm-date-picker__placeholder'}>
          {value ? isoToDisplay(value) : placeholder}
        </span>
        <Calendar size={18} className="hrm-date-picker__icon" aria-hidden />
      </button>
      {popover && createPortal(popover, document.body)}
    </div>
  );
}
