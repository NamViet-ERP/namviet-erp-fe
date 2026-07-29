import type { ReactNode } from 'react';

export function PoDetailMeta({
  label,
  value,
  span,
  muted,
}: {
  label: string;
  value: ReactNode;
  span?: 2 | 'all';
  muted?: boolean;
}) {
  const spanClass = span === 'all'
    ? ' pur-detail__field--span-all'
    : span === 2
      ? ' pur-detail__field--span-2'
      : '';
  return (
    <div className={`pur-detail__field${spanClass}`}>
      <div className="pur-detail__field-label">{label}</div>
      <div className={`pur-detail__field-value${muted ? ' pur-detail__field-value--muted' : ''}`}>
        {value}
      </div>
    </div>
  );
}
