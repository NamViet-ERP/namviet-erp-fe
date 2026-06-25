import HrmDatePicker from '../hr/HrmDatePicker';

interface VoucherDateFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
}

export default function VoucherDateFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onReset,
}: VoucherDateFilterProps) {
  const hasFilter = Boolean(from || to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)]">
        <span className="whitespace-nowrap">Từ ngày</span>
        <HrmDatePicker
          value={from}
          onChange={onFromChange}
          placeholder="dd/mm/yyyy"
          className="w-[9.5rem] text-xs"
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)]">
        <span className="whitespace-nowrap">Đến ngày</span>
        <HrmDatePicker
          value={to}
          onChange={onToChange}
          placeholder="dd/mm/yyyy"
          min={from || undefined}
          className="w-[9.5rem] text-xs"
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
