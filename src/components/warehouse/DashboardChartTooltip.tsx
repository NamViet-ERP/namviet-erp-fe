import type { CSSProperties } from 'react';
import type { TooltipProps } from 'recharts';

import { formatCurrency } from '../../utils/formatCurrency';

type TooltipPayload = NonNullable<TooltipProps<number, string>['payload']>[number];

export function DashboardChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip" role="tooltip">
      {label != null && label !== '' && (
        <p className="chart-tooltip__label">{String(label)}</p>
      )}
      {payload.map((entry: TooltipPayload, index) => {
        const color = entry.color ?? entry.fill ?? 'var(--md-primary)';
        const name = entry.name ?? entry.dataKey ?? '';
        const raw = entry.value;
        const display =
          typeof raw === 'number'
            ? formatCurrency(raw)
            : raw != null
              ? String(raw)
              : '—';

        return (
          <div key={`${name}-${index}`} className="chart-tooltip__row">
            <span
              className="chart-tooltip__dot"
              style={{ '--chart-dot-color': color } as CSSProperties}
            />
            <span className="chart-tooltip__name">{name}:</span>
            <span className="chart-tooltip__value">{display}</span>
          </div>
        );
      })}
    </div>
  );
}
