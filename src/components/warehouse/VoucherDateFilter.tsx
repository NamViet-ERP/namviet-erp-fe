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
    <div className={`voucher-date-filter${className ? ` ${className}` : ''}`}>
      <label className="voucher-date-filter__field">
        <span className="voucher-date-filter__label">Từ ngày</span>
        <HrmDatePicker
          className="hrm-filter-date-picker"
          value={from}
          onChange={onFromChange}
          max={to || undefined}
        />
      </label>
      <label className="voucher-date-filter__field">
        <span className="voucher-date-filter__label">Đến ngày</span>
        <HrmDatePicker
          className="hrm-filter-date-picker"
          value={to}
          onChange={onToChange}
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
