import DateRangeField from '../ui/DateRangeField';

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
  return (
    <DateRangeField
      from={from}
      to={to}
      onFromChange={onFromChange}
      onToChange={onToChange}
      onReset={onReset}
      className={className}
    />
  );
}
