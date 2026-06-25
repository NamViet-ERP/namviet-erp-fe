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
        <input
          type="date"
          className="form-input text-xs py-1.5 h-8 w-[9.5rem]"
          value={from}
          onChange={e => onFromChange(e.target.value)}
          aria-label="Lọc từ ngày tạo"
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)]">
        <span className="whitespace-nowrap">Đến ngày</span>
        <input
          type="date"
          className="form-input text-xs py-1.5 h-8 w-[9.5rem]"
          value={to}
          onChange={e => onToChange(e.target.value)}
          aria-label="Lọc đến ngày tạo"
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
