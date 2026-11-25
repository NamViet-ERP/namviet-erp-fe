import { useId } from 'react';
import HrmDatePicker from '../hr/HrmDatePicker';

export interface DateRangeFieldProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset?: () => void;
  fromLabel?: string;
  toLabel?: string;
  resetLabel?: string;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

/** Paired From/To date pickers with cross-clamped bounds, accessible label links, and optional reset. */
export default function DateRangeField({
  from,
  to,
  onFromChange,
  onToChange,
  onReset,
  fromLabel = 'Từ ngày',
  toLabel = 'Đến ngày',
  resetLabel = 'Xóa lọc ngày',
  fromPlaceholder,
  toPlaceholder,
  min,
  max,
  disabled = false,
  className = '',
}: DateRangeFieldProps) {
  const baseId = useId();
  const fromId = `${baseId}-from`;
  const toId = `${baseId}-to`;
  const hasFilter = Boolean(from || to);

  const fromMax = to && max ? (to < max ? to : max) : to || max || undefined;
  const toMin = from && min ? (from > min ? from : min) : from || min || undefined;

  return (
    <div className={['voucher-date-filter', className].filter(Boolean).join(' ')}>
      <div className="voucher-date-filter__field">
        <label htmlFor={fromId} className="voucher-date-filter__label">
          {fromLabel}
        </label>
        <HrmDatePicker
          id={fromId}
          className="hrm-filter-date-picker"
          value={from}
          onChange={onFromChange}
          min={min}
          max={fromMax}
          placeholder={fromPlaceholder}
          disabled={disabled}
        />
      </div>
      <div className="voucher-date-filter__field">
        <label htmlFor={toId} className="voucher-date-filter__label">
          {toLabel}
        </label>
        <HrmDatePicker
          id={toId}
          className="hrm-filter-date-picker"
          value={to}
          onChange={onToChange}
          min={toMin}
          max={max}
          placeholder={toPlaceholder}
          disabled={disabled}
        />
      </div>
      {onReset && hasFilter ? (
        <button
          type="button"
          className="hrm-filter-reset text-xs"
          onClick={onReset}
          disabled={disabled}
        >
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
}
