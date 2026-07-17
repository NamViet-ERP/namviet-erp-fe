import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MONTH_NAMES_TITLE } from '../../hooks/dashboard/calendarConstants';

interface RecruitmentCalMonthYearPickerProps {
  month: number;
  year: number;
  yearOptions: number[];
  onChange: (year: number, month: number) => void;
}

type OpenPanel = 'month' | 'year' | null;

export default function RecruitmentCalMonthYearPicker({
  month,
  year,
  yearOptions,
  onChange,
}: RecruitmentCalMonthYearPickerProps) {
  const [open, setOpen] = useState<OpenPanel>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const monthBtnId = useId();
  const yearBtnId = useId();
  const monthListId = useId();
  const yearListId = useId();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const toggle = (panel: OpenPanel) => setOpen(current => (current === panel ? null : panel));

  return (
    <div
      ref={rootRef}
      className={['recruitment-cal-nav__picker', open && 'recruitment-cal-nav__picker--open'].filter(Boolean).join(' ')}
    >
      <div className="recruitment-cal-nav__picker-part">
        <button
          type="button"
          id={monthBtnId}
          className="recruitment-cal-nav__picker-btn"
          aria-haspopup="listbox"
          aria-expanded={open === 'month'}
          aria-controls={monthListId}
          onClick={() => toggle('month')}
        >
          {MONTH_NAMES_TITLE[month]}
          <ChevronDown size={14} className="recruitment-cal-nav__chevron" aria-hidden />
        </button>
        {open === 'month' && (
          <ul id={monthListId} className="recruitment-cal-nav__menu" role="listbox" aria-labelledby={monthBtnId}>
            {MONTH_NAMES_TITLE.map((label, i) => (
              <li key={label} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={i === month}
                  className={['recruitment-cal-nav__menu-item', i === month && 'recruitment-cal-nav__menu-item--active'].filter(Boolean).join(' ')}
                  onClick={() => {
                    onChange(year, i);
                    setOpen(null);
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className="recruitment-cal-nav__sep">/</span>

      <div className="recruitment-cal-nav__picker-part">
        <button
          type="button"
          id={yearBtnId}
          className="recruitment-cal-nav__picker-btn"
          aria-haspopup="listbox"
          aria-expanded={open === 'year'}
          aria-controls={yearListId}
          onClick={() => toggle('year')}
        >
          {year}
          <ChevronDown size={14} className="recruitment-cal-nav__chevron" aria-hidden />
        </button>
        {open === 'year' && (
          <ul id={yearListId} className="recruitment-cal-nav__menu recruitment-cal-nav__menu--year" role="listbox" aria-labelledby={yearBtnId}>
            {yearOptions.map(y => (
              <li key={y} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={y === year}
                  className={['recruitment-cal-nav__menu-item', y === year && 'recruitment-cal-nav__menu-item--active'].filter(Boolean).join(' ')}
                  onClick={() => {
                    onChange(y, month);
                    setOpen(null);
                  }}
                >
                  {y}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
