import HrmDatePicker from '../hr/HrmDatePicker';

interface VoucherDateFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
  /** Optional class on the wrapper for layout tweaks. */
  className?: string;
}

/** Shared Từ ngày / Đến ngày filter — used by WMS lists and purchasing. */
export default function VoucherDateFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onReset,
  className,
}: VoucherDateFilterProps) {
  const hasFilter = Boolean(from || to);

  return (
    <div className={`flex flex-wrap items-center gap-2${className ? ` ${className}` : ''}`}>
      <label className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)]">
        <span className="whitespace-nowrap">Từ ngày</span>
        <HrmDatePicker
          className="hrm-filter-date-picker"
          value={from}
          onChange={onFromChange}
          placeholder="mm/dd/yyyy"
          max={to || undefined}
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)]">
        <span className="whitespace-nowrap">Đến ngày</span>
        <HrmDatePicker
          className="hrm-filter-date-picker"
          value={to}
          onChange={onToChange}
          placeholder="mm/dd/yyyy"
          min={from || undefined}
        />
      </label>
      {hasFilter && (
        <button type="button" className="hrm-filter-reset text-xs" onClick={onReset}>
          Xóa lọc ngày
        </button>
      )}
    </div>
  );
}
